const TYPE = {
  VALUE: 'VALUE',
  EOL: 'EOL',
  SEP: 'SEPARATE'
};

const SEP = ':';
const WORD_START_REG = /[^\r\n: ]/;
const WORD_REG = /[^\r\n:]/;

// TODO position

function tokenizer(text) {
  let index = 0;
  let line = 1;
  let column = 0;
  let tokens = [];

  function next(breakLine) {
    index++;
    if (breakLine) {
      line++;
      column = 0;
    } else {
      column++;
    }
    return text[index];
  }

  function getLoc() {
    return {
      line,
      column,
      position: index
    };
  }

  while (index < text.length) {
    let char = text[index];

    if (char === ' ') {
      next();
      continue;
    }

    if (char === '\n') {
      tokens.push({
        type: TYPE.EOL,
        value: char,
        loc: getLoc()
      });
      next(true);
      continue;
    }

    if (char === '\r') {
      next();
      continue;
    }

    if (char === SEP) {
      tokens.push({
        type: TYPE.SEP,
        value: char,
        loc: getLoc()
      });
      next();
      continue;
    }

    if (WORD_START_REG.test(char)) {
      let value = char;
      char = next();


      while (WORD_REG.test(char)) {
        value += char;
        char = next();
      }

      tokens.push({
        type: TYPE.VALUE,
        value: value.replace(/( )+$/, ''),
        loc: getLoc()
      });
      continue;
    }

    throw new Error(`Unexpected char: \`${char}\` at position ${index} (${line},${column})`);
  }

  return tokens;
}

function parser(tokens) {
  let current = 0;

  function walk() {
    let token = tokens[current];
    if (!token) return null;

    function throwError(token) {
      throw new Error(`Unexpected token: \`${token.value}\` at position ${token.loc.position} (${token.loc.line},${token.loc.column})`);
    }

    if (token.type === TYPE.VALUE) {
      let node = {
        type: 'Section',
        key: token.value,
        value: null
      };

      token = tokens[++current];
      if (!token) return null;

      if (token.type === TYPE.SEP) {
        token = tokens[++current];

        if (token.type === TYPE.VALUE) {
          node.value = token.value;
        } else {
          return node;
        }

        token = tokens[++current];
        if (!token) return null;
        if (token.type === TYPE.EOL) {
          current++;
          return node;
        }
      } else {
        throwError(tokens[current - 1]);
      }
    }

    if (token.type === TYPE.EOL) {
      current++;
      return null;
    }

    throwError(token);
  }

  let ast = {
    type: 'Root',
    body: []
  };

  while (current < tokens.length) {
    const result = walk();
    if (result != null) {
      ast.body.push(result);
    }
  }

  return ast;
}

function traverser(ast, visitor) {
  function traverseArray(array) {
    array.forEach(node => traverseNode(node));
  }

  function traverseNode(node) {
    let method = visitor[node.type];
    if (typeof method === 'function') {
      method(node);
    }

    switch (node.type) {
      case 'Root':
        traverseArray(node.body);
        break;
      case 'Section':
        break;
      default:
        throw new TypeError(`Unexpected token type: ${node.type}`);
    }
  }

  traverseNode(ast);
}

module.exports = function compiler(source) {
  let tokens = tokenizer(source);
  let ast = parser(tokens);
  let result = {};

  traverser(ast, {
    Section(node) {
      result[node.key] = node.value;
    }
  });

  return result;
};
