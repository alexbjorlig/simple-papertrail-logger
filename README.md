
## Why should you use this pakcage?

Becase Auth0 don't have a nice way of working with console output and logs, when using the new Actions.
(or rules for that matter).

This package will make it easy for you to send logs to papertrail.

It defaults to failSilent, so your actions won't stop working just because the logging framework 
for some reason does not work.

See source code for properties and defaults. Happy coding 🍻

## How to use

1) Add this package as a dependency, using the "Add Module" `simple-papertrail-logger@latest`.
2) Sign up for a papertrail account, and generate a log endpoint. This will give you a log token.
3) Save the log token to your secrects and call it LOG_KEY.
4) Use the logger in your code, like this:

```typescript

const logger = new SimplePapertrailLogger({papertrailToken: context.secrets.LOG_KEY})
try {
    logger.addMessage('test this out');
} catch (err) {
    logger.addMessage('Some code failed');
} finally {
    logger.sendMessages()
    .then((result) => console.log(result)) // <== Make the result of the papertrail logs visible to Auth0 logs
}
```