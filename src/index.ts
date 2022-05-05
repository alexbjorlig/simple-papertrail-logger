
import { nanoid } from 'nanoid';
import { EOL } from 'os';

declare interface SimplePapertrailLoggerOpts {
    /**
     * Add an optional string to identify log statements.
     * In Auth0 Actions, this could be the hostname, i.e.:
     * event.actor.hostname
     * @type {string}
     * @memberof SimplePapertrailLoggerOpts
     */
    logIdentifier?: string;
    /**
     * Defaults to https://logs.collector.solarwinds.com/v1/logs
     * @type {string}
     * @memberof SimplePapertrailLoggerOpts
     */
    papertrailUrl?: string;
    /**
     * Provide the secret for above destination.
     * In Auth0 custom actions you can access the scret with:
     *  context.secrets.<NAME_OF_SECRET>
     * @type {string}
     * @memberof SimplePapertrailLoggerOpts
     */
    papertrailToken: string;
}

export class SimplePapertrailLogger {

    public uniqueId: string;
    private messageBuffer: string;
    private opts: SimplePapertrailLoggerOpts;

    constructor(opts: SimplePapertrailLoggerOpts) {
        this.uniqueId = nanoid(8);
        this.messageBuffer = '';
        this.opts = opts;

    }

    addMessage(message: string) {
        if (!message.trim()) {
            return;
        }

        let newMessage = `<14>1 - ${this.opts.logIdentifier} ${this.uniqueId} - - - ${message}${EOL}`;
        this.messageBuffer += newMessage;
    }

    /**
     *Call this method when your Auth0 action is done; like this:
     * 
     *  const logger = new SimplePapertrailLogger();
     *  try {
     *     // Do your code stuff here.
     *  } catch (err) {
     *     
     *  } finally {
     *      // for performance reasons, don't await the result.
     *      logger.sendMessages().then((result) => console.log(result))
     *  }
     *
     * @param {boolean} [failSilent=true] Typically you will call this block of code in the finally block.
     * If you wan't the process to swallow any errors regarding to logging, you can use the failSilent flag.
     * It defaults to true, i.e. if it's unable to send the logs, no error will be thrown.
     * @returns {Promise<string>}
     * @memberof SimplePapertrailLogger
     */
    async sendMessages(failSilent: boolean = true): Promise<string> {
        try {
            const {papertrailToken, papertrailUrl = 'https://logs.collector.solarwinds.com/v1/logs'} = this.opts;
            if (!papertrailToken) {
                throw new Error(`You must provide a papertrailToken...`);
            }
            if (!papertrailUrl) {
                throw new Error(`You must provide a papertrailUrl`)
            }
            const fetch = (await import('node-fetch')).default;
            const logKeyAsBase64 = Buffer.from(papertrailToken).toString('base64');
            if (!this.messageBuffer) {
                return 'No log messages to send.';
            }
            const result = await fetch(papertrailUrl, {
                method: 'post',
                headers: {
                    'Content-Type': 'text/plain',
                    Authorization: `Basic ${logKeyAsBase64}`,
                },
                body: this.messageBuffer,
            });

            if (result.ok) {
                this.messageBuffer = '';
                return `Log status: ✅  https://my.papertrailapp.com/events?q=${this.uniqueId}`;
            }
            const httpErrorCode = result.status;
            const errMessageAsTest = await result.text();
            throw new Error(`Http status code was "${httpErrorCode}": ${errMessageAsTest}`);
        } catch (error) {
            if (failSilent) {
                return `Log status:❗️ Failed unexpected with '${error?.message}'`
            } else {
                throw new Error(`SendMessages failed unexpected with '${error?.message}'`);
            }
        }
    }
}