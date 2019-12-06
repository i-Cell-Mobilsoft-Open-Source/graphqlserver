const application = require('./dist');

module.exports = application;

if (require.main === module) {
    // Run the application
    const config = {
        rest: {
            port: +(process.env.PORT || 3000),
            host: process.env.HOST,
            openApiSpec: {
                // useful when used with OpenAPI-to-GraphQL to locate your application
                setServersFromRequest: true,
            },
            listenOnStart: false,
        },
    };
    application.main(config).catch(err => {
        console.error('Cannot start the application.', err);
        process.exit(1);
    });
}
