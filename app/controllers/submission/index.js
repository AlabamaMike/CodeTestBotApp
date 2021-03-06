import Ember from 'ember';
import UserAwareControllerMixin from 'code-test-bot-app/mixins/user-aware-controller';
import { cumulativeMovingAverage } from 'code-test-bot-app/utils/math';
import Score from 'code-test-bot-app/models/score';
import Config from 'code-test-bot-app/config/environment';

export default Ember.ObjectController.extend(UserAwareControllerMixin, {
    userHasPublishedAssessment: false,

    canShowPrivateDetails: function () {
        if (this.get('isRecruiter') || this.get('isInactive')) {
            return true;
        }
    }.property('isRecruiter', 'isInactive'),

    assessments: function () {
        var id = this.get('id');
        return this.store.filter('assessment', {submission_id: id, include_unpublished: true}, function (assessment) {
            return assessment.get('submission.id') === id;
        });
    }.property('id'),

    publishedAssessments: Ember.computed.filterBy('assessments', 'published', true),
    unpublishedAssessments: Ember.computed.filterBy('assessments', 'published', false),

    rawAverageScore: Ember.reduceComputed('publishedAssessments', {
        initialValue: 0,
        initialize: function (initialValue, changeMeta, instanceMeta) {
            instanceMeta.count = 0;
        },
        addedItem: function (accumulatedValue, item, changeMeta, instanceMeta) {
            var score = item.get('score');
            var avg = cumulativeMovingAverage(accumulatedValue, score, instanceMeta.count);
            instanceMeta.count++;
            return avg;
        },
        removedItem: function (accumulatedValue, item, changeMeta, instanceMeta) {
            var score = item.get('score');
            var avg = cumulativeMovingAverage(accumulatedValue, score, instanceMeta.count, true);
            instanceMeta.count--;
            return avg;
        }
    }),

    averageScore: function () {
        return Math.round(this.get('rawAverageScore'));
    }.property('rawAverageScore'),

    averageScoreText: function () {
        return Score.pluralDisplayTextForScore(this.get('averageScore'));
    }.property('averageScore'),

    hasPublishedAssessments: function () {
        return this.get('publishedAssessments.length') > 0;
    }.property('publishedAssessments.length'),

    isInactive: Ember.computed.not('active'),
    showCloseButton: Ember.computed.and('isRecruiter', 'active'),
    showReportButton: Ember.computed.and('isRecruiter', 'hasPublishedAssessments'),
    showReopenButton: Ember.computed.and('isRecruiter', 'isInactive'),
    showEmailButton: Ember.computed.and('isRecruiter', 'isInactive', 'hasPublishedAssessments'),
    showAssessments: Ember.computed.or('userHasPublishedAssessment', 'isRecruiter', 'isInactive'),
    userCanCreateAssessment: Ember.computed.not('userHasPublishedAssessment'),

    updateUserHasAssessment: function () {
        var assessments = this.get('publishedAssessments');
        this.set('userHasPublishedAssessment', assessments.findBy('assessor.id', this.get('user.id')) !== undefined);
    }.observes('publishedAssessments.[]'),

    newAssessmentButtonText: function () {
        var userId = this.get('user.id');
        var assessments = this.get('unpublishedAssessments');
        if (assessments.findBy('assessor.id', userId) !== undefined) {
            return 'Resume Assessment';
        } else {
            return 'New Assessment';
        }
    }.property('assessments.[]'),

    actions: {
        closeSubmission: function () {
            var self = this;
            var submission = this.get('content');
            submission.set('active', false);
            submission.set('averageScore', this.get('averageScore'));
            submission.save().then(function () {
                self.transitionToRoute('/submissions');
            });
        },

        reopenSubmission: function () {
            var self = this;
            var submission = this.get('content');
            submission.set('active', true);
            submission.save().then(function () {
                self.transitionToRoute('/submissions');
            });
        },

        updateSubmission: function () {
            var self = this;
            var submission = this.get('content');
            submission.save().then(function () {
                submission.set('resumeChanged', false);
                self.transitionToRoute('/submissions');
            });
        },

        emailSummary: function () {
            var submission = this.get('content');
            Ember.$.post(Config.SERVER_HOST + '/email/submission_summary', {id: submission.id}).done(function () {
                alert('Email Sent!');
            }).fail(function(){
                alert('There was a problem sending the email.');
            });
        }

    }
});
