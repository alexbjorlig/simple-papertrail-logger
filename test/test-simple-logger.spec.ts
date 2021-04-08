
import { SimplePapertrailLogger } from '../src/index';
import nock from 'nock';

describe('simple-papertrail-logger', () => {
    const scope = nock('https://logs.collector.solarwinds.com')
        .post('/v1/logs');

    it('Should exists', () => {
        expect(SimplePapertrailLogger).toBeTruthy();
    });

    it('Should send reponse as expected when successfull', async () => {
        const requestExpectation = scope.reply(200);
        const logger = new SimplePapertrailLogger({papertrailToken: 'fake-token', papertrailUrl: 'https://logs.collector.solarwinds.com/v1/logs'});
        logger.addMessage('Message 1');
        logger.addMessage('Message 2');
        const result = await logger.sendMessages();
        expect(result).toMatch(/Log status: ✅ /);
        expect(requestExpectation.isDone()).toBeTruthy();
    });

    it('Should send err reponse when destination is down', async () => {
        for (const errCode of [300, 400, 500]) {
            const requestExpectation = scope.reply(errCode);
            const logger = new SimplePapertrailLogger({papertrailToken: 'fake-token', papertrailUrl: 'https://logs.collector.solarwinds.com/v1/logs'});
            logger.addMessage('Message 1');
            logger.addMessage('Message 2');
            const result = await logger.sendMessages();
            expect(result).toMatch(/Log status:❗️ /);
            expect(requestExpectation.isDone()).toBeTruthy();
        }
    });

    it('Should throw error, if failSilent = false', async () => {
        for (const errCode of [300, 400, 500]) {
            const requestExpectation = scope.reply(errCode);
            
            const logger = new SimplePapertrailLogger({papertrailToken: 'fake-token', papertrailUrl: 'https://logs.collector.solarwinds.com/v1/logs'});
            logger.addMessage('Message 1');
            logger.addMessage('Message 2');
            await expect(logger.sendMessages(false)).rejects.toThrowError(/SendMessages failed unexpected/)
            expect(requestExpectation.isDone()).toBeTruthy();
        }
    });
});
