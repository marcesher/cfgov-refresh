from itertools import chain
from operator import attrgetter

from django.conf import settings
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db import models
from django.db.models import Q

from wagtail.wagtailadmin.edit_handlers import StreamFieldPanel, FieldPanel
from wagtail.wagtailcore.fields import StreamField
from wagtail.wagtailadmin.edit_handlers import TabbedInterface, ObjectList

from . import base, molecules, organisms, ref
from .learn_page import AbstractFilterPage
from .. import forms
from ..util import filterable_context


class BrowseFilterablePage(base.CFGOVPage):
    header = StreamField([
        ('text_introduction', molecules.TextIntroduction()),
        ('featured_content', molecules.FeaturedContent()),
    ])
    content = StreamField([
        ('full_width_text', organisms.FullWidthText()),
        ('filter_controls', organisms.FilterControls()),
    ])

    secondary_nav_exclude_sibling_pages = models.BooleanField(default=False)

    # General content tab
    content_panels = base.CFGOVPage.content_panels + [
        StreamFieldPanel('header'),
        StreamFieldPanel('content'),
    ]

    sidefoot_panels = base.CFGOVPage.sidefoot_panels + [
        FieldPanel('secondary_nav_exclude_sibling_pages'),
    ]

    # Tab handler interface
    edit_handler = TabbedInterface([
        ObjectList(content_panels, heading='General Content'),
        ObjectList(sidefoot_panels, heading='SideFoot'),
        ObjectList(base.CFGOVPage.settings_panels, heading='Configuration'),
    ])

    template = 'browse-filterable/index.html'

    def add_page_js(self, js):
        super(BrowseFilterablePage, self).add_page_js(js)
        js['template'] += ['secondary-navigation.js']

    def get_context(self, request, *args, **kwargs):
        context = super(BrowseFilterablePage, self).get_context(request, *args, **kwargs)
        return filterable_context.get_context(self, request, context)

    def get_form_class(self):
        return forms.FilterableListForm

    def get_page_set(self, form, hostname):
        return filterable_context.get_page_set(self, form, hostname)


class EventArchivePage(BrowseFilterablePage):
    def get_form_class(self):
        return forms.EventArchiveFilterForm

    def get_template(self, request, *args, **kwargs):
        return BrowseFilterablePage.template


class NewsroomLandingPage(BrowseFilterablePage):
    template = 'newsroom/index.html'

    def get_page_set(self, form, hostname):
        get_blog = False
        for f in self.content:
            if 'filter_controls' in f.block_type and f.value['categories']['page_type'] == ['newsroom']:
                categories = form.cleaned_data.get('categories', [])
                if not categories or 'blog' in categories:
                    get_blog = True
                    if 'blog' in categories:
                        del categories[categories.index('blog')]
        filter_pages = AbstractFilterPage.objects.live_shared(hostname).descendant_of(self).filter(form.generate_query())
        if get_blog:
            try:
                del form.cleaned_data['categories']
                blog = base.CFGOVPage.objects.get(slug='blog')
                blogs = AbstractFilterPage.objects.live_shared(hostname).descendant_of(blog).filter(form.generate_query())
                filter_pages = list(chain(filter_pages, blogs))
            except base.CFGOVPage.DoesNotExist:
                print 'Blog does not exist'
        return sorted(filter_pages, key=lambda x: x.date_published, reverse=True)

    def get_form_class(self):
        return forms.NewsroomFilterForm
