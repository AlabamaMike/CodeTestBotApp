import UserAwareControllerMixin from 'code-test-bot-app/mixins/user-aware-controller';
import { cumulativeMovingAverage, roundToNearestHalf } from 'code-test-bot-app/utils/math';

export default Ember.ObjectController.extend(UserAwareControllerMixin, {
    userHasAssessment: false,

    assessments: function() {
        var id = this.get('id');
        return this.store.filter('assessment', { submission_id: id }, function(assessment) {
            return assessment.get('submission.id') === id;
        });
    }.property('id'),

    rawAverageScore: Ember.reduceComputed('assessments', {
        initialValue: 0,
        initialize: function(initialValue, changeMeta, instanceMeta) {
            instanceMeta.count = 0;
        },
        addedItem: function(accumulatedValue, item, changeMeta, instanceMeta) {
            var score = item.get('score');
            var avg = cumulativeMovingAverage(accumulatedValue, score, instanceMeta.count);
            instanceMeta.count++;
            return avg;
        },
        removedItem: function(accumulatedValue, item, changeMeta, instanceMeta) {
            var score = item.get('score');
            var avg = cumulativeMovingAverage(accumulatedValue, score, instanceMeta.count, true);
            instanceMeta.count--;
            return avg;
        }
    }),

    averageScore: function() {
        return roundToNearestHalf(this.get('rawAverageScore'));
    }.property('rawAverageScore'),

    hasAssessments: function() {
        return this.get('assessments.length') > 0;
    }.property('assessments.length'),

    isInactive: Ember.computed.not('active'),
    showCloseButton: Ember.computed.and('isRecruiter', 'active'),
    showReportButton: Ember.computed.and('isRecruiter', 'hasAssessments'),
    showAssessments: Ember.computed.or('userHasAssessment', 'isRecruiter'),
    userCanCreateAssessment: Ember.computed.not('userHasAssessment'),

    updateUserHasAssessment: function() {
        var self = this;
        self.get('assessments').then(function(assessments) {
            self.set('userHasAssessment', assessments.findBy('assessor.id', self.get('user.id')) !== undefined);
        });
    }.observes('assessments.[]'),

    actions: {
        closeSubmission: function() {
            var self = this;
            var submission = this.get('content');
            submission.set('active', false);
            submission.set('averageScore', this.get('averageScore'));
            submission.save().then(function() {
                self.transitionToRoute('/submissions');
            });
        }
    }
});
