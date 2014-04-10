CodeTestBotApp.Router.reopen({
    location: 'history'
});

CodeTestBotApp.Router.map(function() {
    this.resource('candidates', function() {
        this.route('new');
    });

    this.resource('submissions', function() {
        this.route('new');
    });

    this.resource('submission', { path: '/submissions/:submission_id' }, function() {
        this.resource('assessments', function() {
            this.route('new')
        });
    });

    this.resource('auth', function() {
        this.route('login');
        this.route('logout');
        this.route('complete');
    });
});

CodeTestBotApp.ApplicationRoute = Ember.Route.extend(Ember.SimpleAuth.ApplicationRouteMixin);

CodeTestBotApp.CandidatesIndexView = CodeTestBotApp.FoundationView.extend();
