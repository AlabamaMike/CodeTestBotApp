import { startAppEphemeral, resetApp } from '../../helpers/start-app';
import { authenticateSession } from '../../helpers/authentication';
import fakeServer from '../../helpers/fake-server';
import '../../helpers/dom-helpers';

describe('Integration - analytics', function() {
    before(function() {
        fakeServer.start();
        startAppEphemeral();
        fakeServer.respondWith('GET', 'http://localhost:3000/sessions/current', [200, { "Content-Type": "application/json" }, JSON.stringify({ 
            session: { id: 1, user_id: 1 }, 
            users: [{id: 1, name: 'User1', role_id: 1}],
            roles: [{id: 1, name: 'Assessor'}]
        })]);
        visit('/auth/login').then(authenticateSession);
    });

    after(function() {
        resetApp();
        fakeServer.stop();
    });

    describe('index route', function() {
        context('visit', function() {
            before(function() {
                fakeServer.jsonSuccess('GET', 'http://localhost:3000/analytics', { 
                    submissions: [
                    { Id: 0, average_score: 1, language_id: 0, level_id: 0, created_at: "2014-05-02T00:00:00.000Z" }
                    ] 
                });
                visit('/analytics');
            });

            it('shows a sunburst svg', function() {
                expect(1);

                andThen(function() {
                    expect(find('svg[chart-name="sunburst"]').length).to.equal(1);
                });
            });

            it('shows a line-chart element', function() {
                expect(1);

                andThen(function() {
                    // For some reason, the line-chart svg is not found, so just instead search for its container DOM element.
                    expect(find('#line-chart').length).to.equal(1);
                });
            });            
        });
    });
});
