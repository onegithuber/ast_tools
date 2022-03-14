const types = require("@babel/types");
const traverse_reserve = {
    UnaryExpression(path) {
        fix(path)
    }

}

function fix(path) {
    let node = path.node;
    if(!types.isUnaryExpression(node)){
        return
    }
    if(node.operator!=="void"){
        return;
    }
    if(!types.isConditional(node.argument)){
        return;
    }
    path.replaceWith(types.UnaryExpression(operator="!",argument=types.CallExpression(callee=types.FunctionExpression(types.identifier(''),[],types.BlockStatement(body=[types.ExpressionStatement(expression=node.argument)])),argument=[])));
}
exports.fix = traverse_reserve