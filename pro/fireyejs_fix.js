/*****************************************************
 *
 *
 * Author:  sml2h3
 * Date:    2021-03-12
 * File:    trademark_fix
 * Project: ast_tools
 *****************************************************/

const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;

const IfWithExpressFix = require('../libs/common/IfWithExpressFix')
const ForWithExpressFix = require('../libs/common/ForWithExpressFix')
const ForWithForFix = require('../libs/common/ForWithForFix')
const VariableDeclaratorFix = require('../libs/common/VariableDeclaratorFix')
const ConditionalFix = require('../libs/common/ConditionalFix')
const ReturnSeqFix = require('../libs/common/ReturnSeqFix')
const SequenceExpressionFix = require('../libs/common/SequenceExpressionFix')
const AssignmentWithConditionalFix = require('../libs/common/AssignmentWithConditionalFix')
const LogicalExpressionFix = require('../libs/common/LogicalExpressionFix')
const ControlFlowFix = require('../libs/fireyejs_demo/ControlFlowFix')
const UnaryFunctionFix = require('../libs/common/UnaryFunctionFix')
const ConstantFix = require('../libs/fireyejs_demo/ConstantFix')
const DecryptVariableFix = require('../libs/fireyejs_demo/DecryptVariableFix')
const CleanNullFix = require('../libs/common/CleanNullIfFix')
const ReserveStrFix = require('../libs/fireyejs_demo/ReserveStrFix')
const UnaryExpressionFix = require('../libs/fireyejs_demo/UnaryExpressionFix')

function fix(source_code) {
    const ast0 = parser.parse(source_code)
    // 格式修复
    traverse(ast0, UnaryExpressionFix.fix)

    const ast = parser.parse(generator(ast0).code)
    traverse(ast, IfWithExpressFix.fix)
    traverse(ast, ForWithExpressFix.fix)
    traverse(ast, ForWithForFix.fix)
    traverse(ast, ReturnSeqFix.fix)


    // 内容修复
    traverse(ast, VariableDeclaratorFix.fix)
    traverse(ast, ConditionalFix.fix)

    traverse(ast, SequenceExpressionFix.fix)
    traverse(ast, AssignmentWithConditionalFix.fix)



    global.flag = true;
    while (global.flag){
        global.flag = false
        traverse(ast, LogicalExpressionFix.fix)
        traverse(ast, SequenceExpressionFix.fix)
        traverse(ast, ConditionalFix.fix)

    }
    // return generator(ast).code
    traverse(ast, UnaryFunctionFix.fix)

    traverse(ast, ControlFlowFix.fix)
    return generator(ast).code
    //
    traverse(ast, ConstantFix.fix)
    traverse(ast, DecryptVariableFix.fix)
    traverse(ast, CleanNullFix.fix)
    traverse(ast, ReserveStrFix.fix)
    // traverse(ast, deleteExtraVar.fix)

    const opts = {
        indent: {
            adjustMultilineComment: true,
            style: "        ",
            base: 0
        }
    }
    return generator(ast, opts).code
}

exports.fix = fix