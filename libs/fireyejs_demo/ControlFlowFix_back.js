/*****************************************************
 *
 *
 * Author:  sml2h3
 * Date:    2021-06-09
 * File:    ControlFlowFix
 * Project: ast_tools
 *****************************************************/

const md5 = require('md5-node');
const types = require("@babel/types");
const generator = require("@babel/generator").default;
const LinkNode = require("./LinkNode").LList;
const Node = require("./LinkNode").Node;
const traverse_express = {
    ForStatement(path) {
        fix(path)
    }
}

function fix(path) {
    const node = path.node;
    const scope = path.scope;
    if (types.isBlockStatement(node.body)) {
        // 检测判断是否未for后var + switch的代码形式
        let flag = true;
        let _body = node.body.body
        let _cal_list = []
        for (var idx = 0; idx < _body.length; idx++) {
            if (types.isVariableDeclaration(_body[idx])) {
                _cal_list.push(_body[idx])
            } else {
                if (types.isSwitchStatement(_body[idx])) {
                    break
                } else {
                    flag = false
                    break
                }
            }
        }
        if (flag) {
            console.log("发现存在控制流混淆的代码片段")

            /**
             * 封装控制流控制器func
             *
             */

            let first_line = _cal_list[0]
            let args = types.isIdentifier(first_line.declarations[0].init.left) ? first_line.declarations[0].init.left : types.isIdentifier(first_line.declarations[0].init.right) ? first_line.declarations[0].init.right : null;

            if (args !== null) {


                let _prop = []
                let _prop_names = []
                for (var ids = 0; ids < _cal_list.length; ids++) {
                    var _prop_name = _cal_list[ids].declarations[0].id.name;
                    _prop.push(types.objectProperty(types.stringLiteral(_prop_name), types.identifier(_prop_name)))
                    _prop_names.push(_prop_name)
                }
                let _ret = types.returnStatement(types.objectExpression(_prop));
                _cal_list.push(_ret)
                var get_param_func = types.expressionStatement(
                    types.callExpression(
                        types.functionExpression(
                            null,
                            [],
                            types.blockStatement(
                                [
                                    types.functionDeclaration(
                                        types.identifier('getparam'),
                                        [args],
                                        types.blockStatement(
                                            _cal_list
                                        )
                                    ),
                                    types.returnStatement(
                                        types.identifier('getparam')
                                    )
                                ]
                            )
                        ),
                        []
                    )
                )
                get_param_func = generator(get_param_func).code
                console.log(get_param_func);
                get_param_func = eval(get_param_func)
                let control_param = node.init.declarations;
                if (control_param.length === 1) {
                    let control_param_value = control_param[0].init.value;
                    console.log("控制器参数为 " + args.name + ", 且初始值为" + control_param_value);
                    var check_end = types.expressionStatement(
                        types.callExpression(
                            types.functionExpression(
                                null,
                                [],
                                types.blockStatement(
                                    [
                                        types.functionDeclaration(
                                            types.identifier('check_end'),
                                            [args],
                                            types.blockStatement(
                                                [types.returnStatement(node.test)]
                                            )
                                        ),
                                        types.returnStatement(
                                            types.identifier('check_end')
                                        )
                                    ]
                                )
                            ),
                            []
                        )
                    )
                    check_end = generator(check_end).code
                    console.log(check_end);
                    check_end = eval(check_end)
                    let control_struct_main = node.body.body[_cal_list.length - 1]

                    var get_control_struct = function (ast) {
                        if (types.isSwitchStatement(ast)) {
                            let control_struct_obj = {};
                            if (_prop_names.indexOf(ast.discriminant.name) >= 0) {
                                control_struct_obj.test_name = ast.discriminant.name;
                                control_struct_obj.block = {}
                                let codes = [];
                                for (var idx = 0; idx < ast.cases.length; idx++) {
                                    var _control_struct = get_control_struct(ast.cases[idx])

                                    if (_control_struct.length === 2 && typeof _control_struct[1] === "object" && 'test_name' in _control_struct[1]) {
                                        if (_control_struct[1].test_name === control_struct_obj.test_name) {
                                            // 合并
                                            for (var key in _control_struct[1].block) {
                                                control_struct_obj.block[key] = _control_struct[1].block[key]
                                            }
                                        } else {
                                            // 父子
                                            control_struct_obj.block[ast.cases[idx].test.value] = _control_struct[1]
                                        }
                                    } else {
                                        control_struct_obj.block[ast.cases[idx].test.value] = _control_struct.slice(1)
                                    }


                                    // control_struct_obj.block[ast.cases[idx].test.value] = _control_struct[1]
                                }

                                // codes.push(true)


                                return [true, control_struct_obj]
                            } else {
                                // switch结构但并不是控制流
                                debugger
                            }

                        } else if (types.isIfStatement(ast)) {
                            let control_struct_obj = {};
                            if (types.isBinaryExpression(ast.test) && ((types.isIdentifier(ast.test.left) && _prop_names.indexOf(ast.test.left.name) >= 0) || (types.isIdentifier(ast.test.right) && _prop_names.indexOf(ast.test.right.name) >= 0))) {
                                let test_name = (types.isIdentifier(ast.test.left) && _prop_names.indexOf(ast.test.left.name) >= 0) ? ast.test.left.name : ast.test.right.name;
                                let codes = [];
                                control_struct_obj.test_name = test_name;
                                control_struct_obj.block = {}
                                let consequent_value_node = (types.isIdentifier(ast.test.left) && _prop_names.indexOf(ast.test.left.name) >= 0) ? ast.test.right : ast.test.left;
                                let consequent_value_op = ast.test.operator
                                if (consequent_value_op === "==") {
                                    var consequent_value = consequent_value_node.value
                                    var alternate_value = null;
                                } else if (consequent_value_op === ">") {
                                    if (types.isIdentifier(ast.test.left) && _prop_names.indexOf(ast.test.left.name) >= 0) {
                                        var consequent_value = consequent_value_node.value + 1
                                        var alternate_value = consequent_value_node.value - 1
                                    } else {
                                        var consequent_value = consequent_value_node.value - 1
                                        var alternate_value = consequent_value_node.value + 1
                                    }
                                } else {
                                    if (types.isIdentifier(ast.test.left) && _prop_names.indexOf(ast.test.left.name) >= 0) {
                                        var consequent_value = consequent_value_node.value - 1
                                        var alternate_value = consequent_value_node.value + 1
                                    } else {
                                        var consequent_value = consequent_value_node.value + 1
                                        var alternate_value = consequent_value_node.value - 1
                                    }
                                }
                                let consequent_control_struct = get_control_struct(ast.consequent);
                                if (consequent_control_struct[0]) {
                                    codes.push(true)
                                    if (consequent_control_struct.length === 2 && typeof consequent_control_struct[1] === "object" && 'test_name' in consequent_control_struct[1]) {
                                        if (consequent_control_struct[1].test_name === test_name) {
                                            // 合并
                                            for (var key in consequent_control_struct[1].block) {
                                                control_struct_obj.block[key] = consequent_control_struct[1].block[key]
                                            }
                                        } else {
                                            // 父子
                                            control_struct_obj.block[consequent_value] = consequent_control_struct[1]
                                        }
                                    } else {
                                        control_struct_obj.block[consequent_value] = consequent_control_struct.slice(1)
                                    }
                                } else {
                                    codes.push(false)
                                    // debugger
                                }
                                if (ast.alternate !== null) {
                                    let alternate_control_struct = get_control_struct(ast.alternate);
                                    if (alternate_control_struct[0]) {
                                        codes[0] = true
                                        if (alternate_control_struct.length === 2 && typeof alternate_control_struct[1] === "object" && 'test_name' in alternate_control_struct[1]) {
                                            if (alternate_control_struct[1].test_name === test_name) {
                                                // 合并
                                                for (var key in alternate_control_struct[1].block) {

                                                    control_struct_obj.block[key] = alternate_control_struct[1].block[key]
                                                }
                                            } else {
                                                // 父子
                                                control_struct_obj.block[alternate_value] = alternate_control_struct[1]
                                            }
                                        } else {
                                            control_struct_obj.block[alternate_value] = alternate_control_struct.slice(1)
                                        }

                                    } else {
                                        debugger
                                    }
                                }

                                // debugger
                                codes.push(control_struct_obj)
                                return codes
                            } else {
                                return [true, ast]
                            }
                        } else {
                            // SwitchCase
                            // debugger
                            if (types.isSwitchCase(ast)) {
                                let codes = []
                                for (var idx = 0; idx < ast.consequent.length; idx++) {
                                    if (types.isBreakStatement(ast.consequent[idx])) {
                                        break;
                                    }
                                    if (types.isSwitchStatement(ast.consequent[idx])) {
                                        var _control_struct = get_control_struct(ast.consequent[idx])
                                        if (_control_struct[0]) {
                                            if (idx === 0) {
                                                codes.push(true)
                                            }
                                            for (var ids = 1; ids < _control_struct.length; ids++) {
                                                codes.push(_control_struct[ids])
                                            }
                                        } else {
                                            if (idx === 0) {
                                                codes.push(false)
                                            }
                                        }
                                    } else if (types.isIfStatement(ast.consequent[idx])) {
                                        var _control_struct = get_control_struct(ast.consequent[idx])
                                        if (_control_struct[0]) {
                                            if (idx === 0) {
                                                codes.push(true)
                                            }
                                            for (var ids = 1; ids < _control_struct.length; ids++) {
                                                codes.push(_control_struct[ids])
                                            }
                                        } else {
                                            if (idx === 0) {
                                                codes.push(false)
                                            }
                                        }
                                    } else {
                                        if (idx === 0) {
                                            codes.push(true)
                                        }
                                        codes.push(ast.consequent[idx])
                                    }
                                }
                                return codes;
                            } else if (types.isBlockStatement(ast)) {
                                let codes = []
                                for (var idx = 0; idx < ast.body.length; idx++) {
                                    if (types.isBreakStatement(ast.body[idx])) {
                                        break;
                                    }
                                    if (types.isSwitchStatement(ast.body[idx])) {
                                        var _control_struct = get_control_struct(ast.body[idx])
                                        if (_control_struct[0]) {
                                            if (idx === 0) {
                                                codes.push(true)
                                            }
                                            for (var ids = 1; ids < _control_struct.length; ids++) {
                                                codes.push(_control_struct[ids])
                                            }

                                        } else {
                                            if (idx === 0) {
                                                codes.push(false)
                                            }
                                        }
                                    } else if (types.isIfStatement(ast.body[idx])) {
                                        var _control_struct = get_control_struct(ast.body[idx])
                                        if (_control_struct[0]) {
                                            if (idx === 0) {
                                                codes.push(true)
                                            }
                                            for (var ids = 1; ids < _control_struct.length; ids++) {
                                                codes.push(_control_struct[ids])
                                            }
                                        } else {
                                            if (idx === 0) {
                                                codes.push(false)
                                            }
                                        }

                                    } else {
                                        if (idx === 0) {
                                            codes.push(true)
                                        }
                                        codes.push(ast.body[idx])
                                    }
                                }
                                return codes
                            }
                        }
                    }
                    let steps_hash_list = []
                    let bodys = []
                    const get_next_control_param = function (ast_list) {
                        let next_node = ast_list[ast_list.length - 1]
                        let res = []
                        if (types.isIfStatement(next_node)) {
                            res.push('if')
                            if (next_node.consequent !== null) {
                                if (next_node.consequent.body.length > 1) {
                                    debugger
                                }
                                res.push(next_node.consequent.body[0].expression.right.value)
                            }
                            if (next_node.alternate !== null) {
                                if (next_node.alternate.body.length > 1) {
                                    debugger
                                }
                                res.push(next_node.alternate.body[0].expression.right.value)
                            }
                        } else if (types.isExpressionStatement(next_node) && types.isAssignmentExpression(next_node.expression)) {
                            res.push('common')
                            if (types.isUnaryExpression(next_node.expression.right)) {
                                res.push(void next_node.expression.right.argument.value)
                            } else {
                                res.push(next_node.expression.right.value)
                            }

                        } else if (types.isReturnStatement(next_node)) {
                            res.push('return')
                        } else {
                            debugger
                        }
                        return res
                    }
                    let control_struct = get_control_struct(control_struct_main)
                    control_struct = control_struct[1]

                    let code_link= new LinkNode(control_param_value);//控制流开始节点
                    const get_code = function (control_struct, control_param_value, last_res_list = [], is_alter = false, alternate_node = null, stack = [], res_list = [], get_first=false, next_node=null, while_break_next_node=null) {
                        let param = get_param_func(control_param_value)
                        let control_struct_step = control_struct;
                        let test_name_step = control_struct_step.test_name;
                        while (true) {
                            control_struct_step = control_struct_step.block[param[test_name_step]]
                            if (typeof control_struct_step.length === "undefined") {
                                test_name_step = control_struct_step.test_name;
                            } else {
                                break
                            }
                        }
                        console.log(generator(types.blockStatement(control_struct_step)).code)
                        let control_param_value_list = get_next_control_param(control_struct_step)
                        if(control_param_value_list[0]==="if"){
                            let left = control_param_value_list[1]
                            let right = control_param_value_list[2]
                            if (code_link.find(control_param_value).left===null){
                                code_link.insert(control_param_value,control_struct_step,left,null)
                                get_code(control_struct,left)
                            }
                            if(code_link.find(control_param_value).right===null){
                                code_link.insert(control_param_value,control_struct_step,null,right)
                                get_code(control_struct,right)
                            }
                        }else if (control_param_value_list[0]==="common"){
                            let next = control_param_value_list[1]
                            if(code_link.find(control_param_value).left===null){
                                code_link.insert(control_param_value,control_struct_step,next,null)
                                get_code(control_struct,next)
                            }
                        }else {
                            console.log(control_param_value_list)
                        }

                    }

                    get_code(control_struct, control_param_value)
                    switch (path.parentPath.type) {
                        case 'Program':
                        case 'BlockStatement':
                            let _body = path.parentPath.node.body;
                            for (var ids = 0; ids < ast_new.length; ids++) {
                                _body.splice(_body.indexOf(node), 0, ast_new[ids])
                            }
                            _body.splice(_body.indexOf(node), 1)
                            break;
                    }
                } else {
                    debugger
                }
            }


        } else {
            // 未发现存在控制流混淆的代码片段，不做任何处理
        }

    }

}

exports.fix = traverse_express
