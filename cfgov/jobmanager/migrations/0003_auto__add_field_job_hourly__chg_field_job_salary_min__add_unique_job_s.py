# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'Job.hourly'
        db.add_column(u'jobmanager_job', 'hourly',
                      self.gf('django.db.models.fields.BooleanField')(default=False),
                      keep_default=False)


        # Changing field 'Job.salary_min'
        db.alter_column(u'jobmanager_job', 'salary_min', self.gf('django.db.models.fields.DecimalField')(null=True, max_digits=11, decimal_places=2))
        # Adding unique constraint on 'Job', fields ['slug']
        db.create_unique(u'jobmanager_job', ['slug'])


        # Changing field 'Job.salary_max'
        db.alter_column(u'jobmanager_job', 'salary_max', self.gf('django.db.models.fields.DecimalField')(null=True, max_digits=11, decimal_places=2))

    def backwards(self, orm):
        # Removing unique constraint on 'Job', fields ['slug']
        db.delete_unique(u'jobmanager_job', ['slug'])

        # Deleting field 'Job.hourly'
        db.delete_column(u'jobmanager_job', 'hourly')


        # Changing field 'Job.salary_min'
        db.alter_column(u'jobmanager_job', 'salary_min', self.gf('django.db.models.fields.IntegerField')(null=True))

        # Changing field 'Job.salary_max'
        db.alter_column(u'jobmanager_job', 'salary_max', self.gf('django.db.models.fields.IntegerField')(null=True))

    models = {
        u'jobmanager.applicanttype': {
            'Meta': {'ordering': "['applicant_type']", 'object_name': 'ApplicantType'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'applicant_type': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'slug': ('django.db.models.fields.SlugField', [], {'max_length': '50'})
        },
        u'jobmanager.grade': {
            'Meta': {'ordering': "['grade']", 'object_name': 'Grade'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'grade': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'salary_max': ('django.db.models.fields.IntegerField', [], {}),
            'salary_min': ('django.db.models.fields.IntegerField', [], {}),
            'slug': ('django.db.models.fields.SlugField', [], {'max_length': '50'})
        },
        u'jobmanager.job': {
            'Meta': {'ordering': "['close_date', 'title']", 'object_name': 'Job'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'applicant_types': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['jobmanager.ApplicantType']", 'through': u"orm['jobmanager.JobApplicantType']", 'symmetrical': 'False'}),
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['jobmanager.JobCategory']"}),
            'close_date': ('django.db.models.fields.DateField', [], {}),
            'date_created': ('django.db.models.fields.DateTimeField', [], {}),
            'date_modified': ('django.db.models.fields.DateTimeField', [], {}),
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'grades': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['jobmanager.Grade']", 'symmetrical': 'False'}),
            'hourly': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'locations': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['jobmanager.Location']", 'symmetrical': 'False'}),
            'open_date': ('django.db.models.fields.DateField', [], {}),
            'salary_max': ('django.db.models.fields.DecimalField', [], {'null': 'True', 'max_digits': '11', 'decimal_places': '2', 'blank': 'True'}),
            'salary_min': ('django.db.models.fields.DecimalField', [], {'null': 'True', 'max_digits': '11', 'decimal_places': '2', 'blank': 'True'}),
            'slug': ('django.db.models.fields.SlugField', [], {'unique': 'True', 'max_length': '50'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        u'jobmanager.jobapplicanttype': {
            'Meta': {'ordering': "['job']", 'object_name': 'JobApplicantType'},
            'announcement_close_time': ('django.db.models.fields.TimeField', [], {'null': 'True', 'blank': 'True'}),
            'announcement_email': ('django.db.models.fields.CharField', [], {'max_length': '128', 'null': 'True', 'blank': 'True'}),
            'announcement_number': ('django.db.models.fields.CharField', [], {'max_length': '128', 'null': 'True', 'blank': 'True'}),
            'application_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['jobmanager.ApplicantType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_usajobs': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'job': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['jobmanager.Job']"}),
            'usajobs_url': ('django.db.models.fields.URLField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'})
        },
        u'jobmanager.jobcategory': {
            'Meta': {'ordering': "['job_category']", 'object_name': 'JobCategory'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'blurb': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'job_category': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'slug': ('django.db.models.fields.SlugField', [], {'max_length': '50'})
        },
        u'jobmanager.location': {
            'Meta': {'ordering': "['region']", 'object_name': 'Location'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'region': ('django.db.models.fields.CharField', [], {'max_length': '2'}),
            'region_long': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'slug': ('django.db.models.fields.SlugField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['jobmanager']