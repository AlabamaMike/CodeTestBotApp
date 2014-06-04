import AutoSaveable from 'code-test-bot-app/mixins/auto-saveable';

export default Ember.ObjectController.extend(AutoSaveable, {
    selectedLanguage: null,
    selectedLevel: null,

    isFormIncomplete: function() {
        return Ember.isEmpty(this.get('score')) || Ember.isEmpty(this.get('notes'));
    }.property('score', 'notes'),

    save: function() {
        this.get('content').save();
    },

    actions: {
        createAssessment: function() {
            var self = this;
            var assessment = this.get('content');
            assessment.set('published', true);
            return assessment.save().then(function() {
                self.transitionToRoute('submission.index', assessment.get('submission'));
            });
        }
    }
});
