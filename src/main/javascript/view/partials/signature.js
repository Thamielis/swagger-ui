'use strict';

/* jshint -W122 */
SwaggerUi.partials.signature = (function () {
  // copy-pasted from swagger-js
  var resolveSchema = function (schema) {
    if (_.isPlainObject(schema.schema)) {
      schema = resolveSchema(schema.schema);
    }

    return schema;
  };

  // copy-pasted from swagger-js
  var simpleRef = function (name) {
    if (typeof name === 'undefined') {
      return null;
    }

    if (name.indexOf('#/definitions/') === 0) {
      return name.substring('#/definitions/'.length);
    } else {
      return name;
    }
  };

  // copy-pasted from swagger-js
  var getInlineModel = function(inlineStr) {
    if(/^Inline Model \d+$/.test(inlineStr) && this.inlineModels) {
      var id = parseInt(inlineStr.substr('Inline Model'.length).trim(),10); //
      var model = this.inlineModels[id];
      return model;
    }
    // I'm returning null here, should I rather throw an error?
    return null;
  };

  // copy-pasted from swagger-js
  var formatXml = function(xml) {
    var contexp, fn, formatted, indent, l, lastType, len, lines, ln, pad, reg, transitions, wsexp;
    reg = /(>)(<)(\/*)/g;
    wsexp = /[ ]*(.*)[ ]+\n/g;
    contexp = /(<.+>)(.+\n)/g;
    xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
    pad = 0;
    formatted = '';
    lines = xml.split('\n');
    indent = 0;
    lastType = 'other';
    transitions = {
      'single->single': 0,
      'single->closing': -1,
      'single->opening': 0,
      'single->other': 0,
      'closing->single': 0,
      'closing->closing': -1,
      'closing->opening': 0,
      'closing->other': 0,
      'opening->single': 1,
      'opening->closing': 0,
      'opening->opening': 1,
      'opening->other': 1,
      'other->single': 0,
      'other->closing': -1,
      'other->opening': 0,
      'other->other': 0
    };
    fn = function(ln) {
      var fromTo, j, key, padding, type, types, value;
      types = {
        single: Boolean(ln.match(/<.+\/>/)),
        closing: Boolean(ln.match(/<\/.+>/)),
        opening: Boolean(ln.match(/<[^!?].*>/))
      };
      type = ((function() {
        var results;
        results = [];
        for (key in types) {
          value = types[key];
          if (value) {
            results.push(key);
          }
        }
        return results;
      })())[0];
      type = type === void 0 ? 'other' : type;
      fromTo = lastType + '->' + type;
      lastType = type;
      padding = '';
      indent += transitions[fromTo];
      padding = ((function() {
        var m, ref1, results;
        results = [];
        for (j = m = 0, ref1 = indent; 0 <= ref1 ? m < ref1 : m > ref1; j = 0 <= ref1 ? ++m : --m) {
          results.push('  ');
        }
        return results;
      })()).join('');
      if (fromTo === 'opening->closing') {
        formatted = formatted.substr(0, formatted.length - 1) + ln + '\n';
      } else {
        formatted += padding + ln + '\n';
      }
    };
    for (l = 0, len = lines.length; l < len; l++) {
      ln = lines[l];
      fn(ln);
    }
    return formatted;
  };

  // copy-pasted from swagger-js
  var getModelSignature = function (name, schema, models, modelPropertyMacro) {
    /*
    IaaS : this is th function where we return the link to the json viewer
     */
    console.log(name, schema, models, modelPropertyMacro);
    const html ='<a href="/jsonviewer/">Go to model</a>';
    return html;
  };

  // copy-pasted from swagger-js
  var schemaToJSON = function (schema, models, modelsToIgnore, modelPropertyMacro) {
    // Resolve the schema (Handle nested schemas)
    schema = resolveSchema(schema);

    if(typeof modelPropertyMacro !== 'function') {
      modelPropertyMacro = function(prop){
        return (prop || {}).default;
      };
    }

    modelsToIgnore= modelsToIgnore || {};

    var type = schema.type || 'object';
    var format = schema.format;
    var model;
    var output;

    if (!_.isUndefined(schema.example)) {
      output = schema.example;
    } else if (_.isUndefined(schema.items) && _.isArray(schema.enum)) {
      output = schema.enum[0];
    }

    if (_.isUndefined(output)) {
      if (schema.$ref) {
        model = models[simpleRef(schema.$ref)];

        if (!_.isUndefined(model)) {
          if (_.isUndefined(modelsToIgnore[model.name])) {
            modelsToIgnore[model.name] = model;
            output = schemaToJSON(model.definition, models, modelsToIgnore, modelPropertyMacro);
            delete modelsToIgnore[model.name];
          } else {
            if (model.type === 'array') {
              output = [];
            } else {
              output = {};
            }
          }
        }
      } else if (!_.isUndefined(schema.default)) {
        output = schema.default;
      } else if (type === 'string') {
        if (format === 'date-time') {
          output = new Date().toISOString();
        } else if (format === 'date') {
          output = new Date().toISOString().split('T')[0];
        } else {
          output = 'string';
        }
      } else if (type === 'integer') {
        output = 0;
      } else if (type === 'number') {
        output = 0.0;
      } else if (type === 'boolean') {
        output = true;
      } else if (type === 'object') {
        output = {};

        _.forEach(schema.properties, function (property, name) {
          var cProperty = _.cloneDeep(property);

          // Allow macro to set the default value
          cProperty.default = modelPropertyMacro(property);

          output[name] = schemaToJSON(cProperty, models, modelsToIgnore, modelPropertyMacro);
        });
      } else if (type === 'array') {
        output = [];

        if (_.isArray(schema.items)) {
          _.forEach(schema.items, function (item) {
            output.push(schemaToJSON(item, models, modelsToIgnore, modelPropertyMacro));
          });
        } else if (_.isPlainObject(schema.items)) {
          output.push(schemaToJSON(schema.items, models, modelsToIgnore, modelPropertyMacro));
        } else if (_.isUndefined(schema.items)) {
          output.push({});
        } else {
          console.log('Array type\'s \'items\' property is not an array or an object, cannot process');
        }
      }
    }

    return output;
  };

  // copy-pasted from swagger-js
  var createJSONSample = function (value, modelsToIgnore) {
    modelsToIgnore = modelsToIgnore || {};

    modelsToIgnore[value.name] = value;

    // Response support
    if (value.examples && _.isPlainObject(value.examples) && value.examples['application/json']) {
      value.definition.example = value.examples['application/json'];

      if (_.isString(value.definition.example)) {
        value.definition.example = jsyaml.safeLoad(value.definition.example);
      }
    } else if (!value.definition.example) {
      value.definition.example = value.examples;
    }

    return schemaToJSON(value.definition, value.models, modelsToIgnore, value.modelPropertyMacro);
  };

  // copy-pasted from swagger-js
  var getParameterModelSignature = function (type, definitions) {
      var isPrimitive, listType;

      if (type instanceof Array) {
        listType = true;
        type = type[0];
      }

      // Convert undefined to string of 'undefined'
      if (typeof type === 'undefined') {
        type = 'undefined';
        isPrimitive = true;

      } else if (definitions[type]){
        // a model def exists?
        type = definitions[type]; /* Model */
        isPrimitive = false;

      } else if (getInlineModel(type)) {
        type = getInlineModel(type); /* Model */
        isPrimitive = false;

      } else {
        // We default to primitive
        isPrimitive = true;
      }

      if (isPrimitive) {
        if (listType) {
          return 'Array[' + type + ']';
        } else {
          return type.toString();
        }
      } else {
        if (listType) {
          return 'Array[' + getModelSignature(type.name, type.definition, type.models, type.modelPropertyMacro) + ']';
        } else {
          return getModelSignature(type.name, type.definition, type.models, type.modelPropertyMacro);
        }
      }
  };

  // copy-pasted from swagger-js
  var createParameterJSONSample = function (type, models) {
    var listType, sampleJson, innerType;
    models = models || {};

    listType = (type instanceof Array);
    innerType = listType ? type[0] : type;

    if(models[innerType]) {
      sampleJson = createJSONSample(models[innerType]);
    } else if (getInlineModel(innerType)){
      sampleJson = createJSONSample(getInlineModel(innerType)); // may return null, if type isn't correct
    }


    if (sampleJson) {
      sampleJson = listType ? [sampleJson] : sampleJson;

      if (typeof sampleJson === 'string') {
        return sampleJson;
      } else if (_.isObject(sampleJson)) {
        var t = sampleJson;

        if (sampleJson instanceof Array && sampleJson.length > 0) {
          t = sampleJson[0];
        }

        if (t.nodeName && typeof t === 'Node') {
          var xmlString = new XMLSerializer().serializeToString(t);

          return formatXml(xmlString);
        } else {
          return JSON.stringify(sampleJson, null, 2);
        }
      } else {
        return sampleJson;
      }
    }
  };

  var wrapTag = function (name, value, attrs) {
    var str, attributes;

    attrs = attrs || [];

    attributes = attrs.map(function (attr) {
      return ' ' + attr.name + '="' + attr.value + '"';
    }).join('');

    if (!name) {
      return getErrorMessage('Node name is not provided');
    }

    str = [
      '<', name,
      attributes,
      '>',
      value,
      '</', name, '>'
    ];

    return str.join('');
  };

  var getName = function (name, xml) {
    var result = name || '';

    xml = xml || {};

    if (xml.name) {
      result = xml.name;
    }

    if (xml.prefix) {
      result = xml.prefix + ':' + result;
    }

    return result;
  };

  var getNamespace = function (xml) {
    var namespace = '';
    var name = 'xmlns';

    xml = xml || {};

    if (xml.namespace) {
      namespace = xml.namespace;
    } else {
      return namespace;
    }

    if (xml.prefix) {
      name += ':' + xml.prefix;
    }

    return {
      name: name,
      value: namespace
    };
  };

  var createArrayXML = function (descriptor) {
    var name = descriptor.name;
    var config = descriptor.config;
    var definition = descriptor.definition;
    var models = descriptor.models;
    var value;
    var items = definition.items;
    var xml = definition.xml || {};
    var namespace = getNamespace(xml);
    var attributes = [];

    if (!items) { return getErrorMessage(); }

    value = createSchemaXML(name, items, models, config);

    if (namespace) {
      attributes.push(namespace);
    }

    if (xml.wrapped) {
      value = wrapTag(name, value, attributes);
    }

    return value;
  };

  var getPrimitiveSignature = function (schema) {
    var type, items;

    schema = schema || {};
    items = schema.items || {};
    type = schema.type || '';

    switch (type) {
      case 'object': return 'Object is not a primitive';
      case 'array' : return 'Array[' + (items.format || items.type) + ']';
      default: return schema.format || type;
    }
  };

  var createPrimitiveXML = function (descriptor) {
    var name = descriptor.name;
    var definition = descriptor.definition;
    var primitivesMap = {
      'string': {
        'date': new Date(1).toISOString().split('T')[0],
        'date-time' : new Date(1).toISOString(),
        'default': 'string'
      },
      'integer': {
        'default': 1
      },
      'number': {
        'default': 1.1
      },
      'boolean': {
        'default': true
      }
    };
    var type = definition.type;
    var format = definition.format;
    var xml = definition.xml || {};
    var namespace = getNamespace(xml);
    var attributes = [];
    var value;

    if (_.keys(primitivesMap).indexOf(type) < 0) { return getErrorMessage(); }

    if (_.isArray(definition.enum)){
      value = definition.enum[0];
    } else {
      value = definition.example || primitivesMap[type][format] || primitivesMap[type].default;
    }

    if (xml.attribute) {
      return {name: name, value: value};
    }

    if (namespace) {
      attributes.push(namespace);
    }

    return wrapTag(name, value, attributes);
  };

  function createObjectXML (descriptor) {
    var name = descriptor.name;
    var definition = descriptor.definition;
    var config = descriptor.config;
    var models = descriptor.models;
    var isParam = descriptor.config.isParam;
    var serializedProperties;
    var attrs = [];
    var properties = definition.properties;
    var additionalProperties = definition.additionalProperties;
    var xml = definition.xml;
    var namespace = getNamespace(xml);

    if (namespace) {
      attrs.push(namespace);
    }

    if (!properties && !additionalProperties) { return getErrorMessage(); }

    properties = properties || {};

    serializedProperties = _.map(properties, function (prop, key) {
      var xml, result;

      if (isParam && prop.readOnly) {
        return '';
      }

      xml = prop.xml || {};
      result = createSchemaXML(key, prop, models, config);

      if (xml.attribute) {
        attrs.push(result);
        return '';
      }

      return result;
    }).join('');

    if (additionalProperties) {
      serializedProperties += '<!-- additional elements allowed -->';
    }

    return wrapTag(name, serializedProperties, attrs);
  }

  function getInfiniteLoopMessage (name, loopTo) {
    return wrapTag(name, '<!-- Infinite loop $ref:' + loopTo + ' -->');
  }

  function getErrorMessage (details) {
    details = details ? ': ' + details : '';
    return '<!-- invalid XML' + details + ' -->';
  }

  function createSchemaXML (name, definition, models, config) {
    var $ref = _.isObject(definition) ? definition.$ref : null;
    var output, index;
    config = config || {};
    config.modelsToIgnore = config.modelsToIgnore || [];
    var descriptor = _.isString($ref) ? getDescriptorByRef($ref, name, models, config)
        : getDescriptor(name, definition, models, config);

    if (!descriptor) {
      return getErrorMessage();
    }

    switch (descriptor.type) {
      case 'array':
        output = createArrayXML(descriptor); break;
      case 'object':
        output = createObjectXML(descriptor); break;
      case 'loop':
        output = getInfiniteLoopMessage(descriptor.name, descriptor.config.loopTo); break;
      default:
        output = createPrimitiveXML(descriptor);
    }

    if ($ref && descriptor.type !== 'loop') {
      index = config.modelsToIgnore.indexOf($ref);
      if (index > -1) {
        config.modelsToIgnore.splice(index, 1);
      }
    }

    return output;
  }

  function Descriptor (name, type, definition, models, config) {
    if (arguments.length < 4) {
      throw new Error();
    }

    this.config = config || {};
    this.config.modelsToIgnore = this.config.modelsToIgnore || [];
    this.name = getName(name, definition.xml);
    this.definition = definition;
    this.models = models;
    this.type = type;
  }

  function getDescriptorByRef($ref, name, models, config) {
    var modelType = simpleRef($ref);
    var model = models[modelType] || {};
    var type = model.definition && model.definition.type ? model.definition.type : 'object';
    name = name || model.name;

    if (config.modelsToIgnore.indexOf($ref) > -1) {
      type = 'loop';
      config.loopTo = modelType;
    } else {
      config.modelsToIgnore.push($ref);
    }

    if (!model.definition) {
      return null;
    }

    return new Descriptor(name, type, model.definition, models, config);
  }

  function getDescriptor (name, definition, models, config){
    var type = definition.type || 'object';

    if (!definition) {
      return null;
    }

    return new Descriptor(name, type, definition, models, config);
  }

  function createXMLSample (name, definition, models, isParam) {
    var prolog = '<?xml version="1.0"?>';

    return formatXml(prolog + createSchemaXML(name, definition, models, { isParam: isParam } ));
  }

  return {
      getModelSignature: getModelSignature,
      createJSONSample: createJSONSample,
      getParameterModelSignature: getParameterModelSignature,
      createParameterJSONSample: createParameterJSONSample,
      createSchemaXML: createSchemaXML,
      createXMLSample: createXMLSample,
      getPrimitiveSignature: getPrimitiveSignature
  };

})();
