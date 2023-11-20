const ExpressError = require('../expressError');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

function validate(schema) {
    return (req, res, next) => {
        const validate = ajv.compile(schema);
        const valid = validate(req.body);

        if(!valid) {
            const errors = validate.errors
                            .map(e => `${e.instancePath} ${e.message}`)
                            .join(', ');
            return next(new ExpressError(`Validation failed: ${errors}`, 400));
        }

        next();
    };
}

module.exports = validate;