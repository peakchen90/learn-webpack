const { getOptions } = require('loader-utils');
const validateOption = require('schema-utils');
const parser = require('./parser');

const schema = {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      enum: ['en', 'cn', 'jp']
    }
  }
};


module.exports = function (source) {
  const options = getOptions(this);
  validateOption(schema, options);

  let language = 'en';
  if (options && options.language) {
    language = options.language;
  }

  const data = parser(source);

  return `module.exports = "${data[language] || ''}"`;
};
