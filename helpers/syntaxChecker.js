const TYPE_OPERATION = "op";
const TYPE_KEYWORD = "keyword";
const TYPE_FACT = "fact";

const OP_AND = "and";
const OP_OR = "or";

const KEY_IF = "if";
const KEY_THEN = "then";

const STR_BREADTH = 'Ширина'; // ширина
const STR_DEPTH = 'Глибина';
const STR_RAND = 'Випадково';

const TYPES = [TYPE_OPERATION, TYPE_KEYWORD, TYPE_FACT];
const OPERATIONS = [OP_AND, OP_OR];
const KEYWORDS = [KEY_IF, KEY_THEN];

function isOperation(value) {
    value = value.toLowerCase();
    if(OPERATIONS.indexOf(value) > -1) {
        return true;
    } else {
        return false;
    }
}

function isKeyword(value) {
    value = value.toLowerCase();
    if(KEYWORDS.indexOf(value) > -1) {
        return true;
    } else {
        return false;
    }
}

function isFact(value) {
    return true;
}

function p(text) {
    alert(text);
    // document.write(text);
    // document.writeln("<br>");
}

function buildRuleObj(ruleString) {
    var rule = {};
    var ruleParts = ruleString.split(KEY_THEN);
    rule.antecedent = ruleParts[0].replace(KEY_IF, "").trim();
    rule.consequent = ruleParts[1].trim();
    return rule;
}

function buildNode(expression, parentNode) {
    var node = {}
    var expsOr = expression.split(" or ");
    var expsAnd = expression.split(" and ");
    if(expsOr.length > 1) {
        node.value = "or";
        node.children = [];
        for(var i = 0; i < expsOr.length; i++) {
            var n = buildNode(expsOr[i], node);
            node.children.push(n);
        }
    } else if (expsAnd.length > 1) {
        node.value = "and";
        node.children = [];
        for(var i = 0; i < expsAnd.length; i++) {
            var n = buildNode(expsAnd[i], node);
            node.children.push(n);
        }
    } else {
        node.isTerminal = true;
        node.value = expression.replace(/\s/g, '');
        node.parent = parentNode;
    }
    return node;
}

function checkNode(node, facts) {
    if(node.children) {
        if(node.value == "and") {
            for(var i = 0; i < node.children.length; i++) {
                var isNodeActivated = checkNode(node.children[i], facts);
                if(!isNodeActivated) {
                    return false;
                }
            }
            return true;
        } else if (node.value == "or") {
            for(var i = 0; i < node.children.length; i++) {
                var isNodeActivated = checkNode(node.children[i], facts);
                if(isNodeActivated) {
                    return true;
                }
            }
            return false;
        }
    } else { // terminal
        var pos = facts.indexOf("" + node.value);
        if(facts.indexOf("" + node.value) == -1) {
            return false;
        } else {
            return true;
        }
    }
}

let globalRuleCounter = 0;
function calcComplexity(node) {
    if(node.children) {
        for(var i = 0; i < node.children.length; i++) {
            calcComplexity(node.children[i]);
        }
    } else { // terminal
        globalRuleCounter++;
    }
}

function getTokens(expression) { // Lexical analysys
    var words = expression.split(" ");
    var tokens = [];
    for(var i = 0; i < words.length; i++) {
        var token = {}
        var w = words[i];
        if(isKeyword(w)) {
            token.type = TYPE_KEYWORD;
            w = w.toLowerCase();
        } else if(isOperation(w)) {
            token.type = TYPE_OPERATION;
            w = w.toLowerCase();
        } else if (isFact(w)){
            token.type = TYPE_FACT;
        }
        token.value = w;
        tokens.push(token);
    }
    return tokens;
}

function isSyntaxCorrect(tokens) {
    var isKeywordIfReached = false;
    var isKeywordThenReached = false;
    for(var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        switch(t.type) {
            case TYPE_KEYWORD: {
                if(t.value == KEY_IF) {
                    isKeywordIfReached = true;
                    if(i != 0) {
                        p("Keyword 'if' must be only first");
                        return false;
                    }
                } else if (t.value == KEY_THEN) {
                    if(isKeywordThenReached) {
                        p("Keyword 'then' must be only one");
                        return false;
                    } else {
                        isKeywordThenReached = true;
                    }
                    if(i == 0 || i == 1 || i == tokens.length - 1) {
                        p("Wrong 'then' position");
                        return false;
                    }
                    if(tokens[i - 1].type != TYPE_FACT) {
                        p("Keyword 'then' must be after fact")
                        return false;
                    }
                }
                break;
            }
            case TYPE_OPERATION: {
                if(i == tokens.length - 1) {
                    p("Operation can't be the last word in sentense");
                    return false;
                }
                if(tokens[i - 1].type == TYPE_OPERATION) {
                    p("Operation can't be followed by operation")
                    return false;
                }
                break;
            }
            case TYPE_FACT: {
                if(i == 0) {
                    p("Fact can't be the first word in sentense")
                    return false;
                }
                if(tokens[i - 1].type == TYPE_FACT) {
                    p("Fact can't be followed by fact");
                    return false;
                }
                break;
            }
        }
    }
    if(isKeywordIfReached && isKeywordThenReached) {
        return true;
    } else {
        p("Using keywords 'if' and 'then' is mandatory");
        return false;
    }
}

function checkForGoal(str) {
    str = str.toLowerCase();
    if(str.indexOf('goal') > -1) {
        return true;
    }
}

function buildStartFacts(str) {
    let arrayOfFacts = str.split(',');
    for(let i = 0; i < arrayOfFacts.length; i++) {
        arrayOfFacts[i] = arrayOfFacts[i].trim();
        if(arrayOfFacts[i].indexOf(' ') > -1) {
            return false;
        }
    }
    return arrayOfFacts;
}
function getAllActivatedFacts(node, strategy) {
    var activatedFacts = [];
    if(node.children) {
        if(node.value == OP_AND) {
            for(var i = 0; i < node.children.length; i++) {
                var newActivatedFacts = getAllActivatedFacts(node.children[i]);
                activatedFacts = activatedFacts.concat(newActivatedFacts)
            }
        } else if (node.value == OP_OR) {
            var position = 0;
            if(strategy == STR_BREADTH) {
                position = 0;
            } else if (strategy == STR_DEPTH) {
                position = node.children.length - 1;
            } else if (strategy == STR_RAND) {
                position = getRandomInt(0, node.children.length - 1);
            }
            var newActivatedFacts = getAllActivatedFacts(node.children[position]);
            activatedFacts = activatedFacts.concat(newActivatedFacts)
        }
    } else {
        activatedFacts.push(node.value);
    }
    return activatedFacts;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}