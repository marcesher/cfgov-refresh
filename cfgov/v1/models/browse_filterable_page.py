from itertools import chain
from operator import attrgetter

from django.conf import settings
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db import models
from django.db.models import Q

from wagtail.wagtailadmin.edit_handlers import StreamFieldPanel, FieldPanel
from wagtail.wagtailcore.fields import StreamField
from wagtail.wagtailadmin.edit_handlers import TabbedInterface, ObjectList

from .base import CFGOVPage
from .learn_page import AbstractFilterPage
from .. import forms
from ..atomic_elements import molecules, organisms
from ..feeds import FilterableFeedPageMixin
from ..util.filterable_list import FilterableListMixin


class BrowseFilterablePage(FilterableFeedPageMixin, FilterableListMixin, CFGOVPage):
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
    content_panels = CFGOVPage.content_panels + [
        StreamFieldPanel('header'),
        StreamFieldPanel('content'),
    ]

    sidefoot_panels = CFGOVPage.sidefoot_panels + [
        FieldPanel('secondary_nav_exclude_sibling_pages'),
    ]

    # Tab handler interface
    edit_handler = TabbedInterface([
        ObjectList(content_panels, heading='General Content'),
        ObjectList(sidefoot_panels, heading='SideFoot'),
        ObjectList(CFGOVPage.settings_panels, heading='Configuration'),
    ])

    template = 'browse-filterable/index.html'

    def add_page_js(self, js):
        super(BrowseFilterablePage, self).add_page_js(js)
        js['template'] += ['secondary-navigation.js']


class EventArchivePage(BrowseFilterablePage):
    def get_form_class(self):
        return forms.EventArchiveFilterForm


class NewsroomLandingPage(BrowseFilterablePage):
    template = 'newsroom/index.html'


    def get_form_class(self):
        return forms.NewsroomFilterForm


    def get_page_set(self, form, hostname):
        get_blog = False
        categories_cache = None
        for f in self.content:
            if 'filter_controls' in f.block_type and f.value['categories']['page_type'] == 'newsroom':
                categories = form.cleaned_data.get('categories', [])
                if not categories or 'blog' in categories:
                    get_blog = True
                    if 'blog' in categories:
                        del categories[categories.index('blog')]
                        categories_cache = list(categories)

        blog_q = Q()
        newsroom_q = AbstractFilterPage.objects.child_of_q(self)
        newsroom_q &= form.generate_query()
        if get_blog:
            try:
                del form.cleaned_data['categories']
                blog = CFGOVPage.objects.get(slug='blog')
                blog_q = AbstractFilterPage.objects.child_of_q(blog)
                blog_q &= form.generate_query()
            except CFGOVPage.DoesNotExist:
                print 'Blog does not exist'

        return AbstractFilterPage.objects.live_shared(hostname).filter(newsroom_q | blog_q).distinct().order_by('-date_published')
