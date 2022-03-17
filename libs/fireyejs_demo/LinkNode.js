function Node(element) {
    this.element = element;   //当前节点的元素
    this.left = null;         //左节点节点链接
    this.right = null;         //右节点节点链接
    this.body =null;
}
function LList (element) {
    this.head = new Node( element );     //头节点
    this.find = find;                   //查找节点
    this.insert = insert;               //插入节点
    this.remove = remove;               //删除节点
    this.findPrev = findPrev;           //查找前一个节点
    this.display = display;             //显示链表
}
//查找给定节点
function levelTraversal(root,item){
    if(!root){
        return undefined;
    }
    var queue = [root];
    var result;

    while (queue.length!==0){
        var node = queue.shift();
        if(node.element===item){
            result = node
        }
        if(node.left){
            queue.push(node.left);
        }
        if(node.right){
            queue.push(node.right);
        }
    }
    return result;
}

function find ( item ) {
    var currNode = this.head;
    var result = levelTraversal(currNode,item)
    return result;
}
//插入节点

function insert ( curr , body ,left,right) {
    var currNode = this.find( curr );
    var left_node=null,right_node=null;
    if (left!=null){
        left_node = this.find(left);
        if (left_node===undefined){
            left_node=new Node(left)
        }else {
            left_node = new Node("break")
        }
    }
    if (right!=null){
        right_node = this.find(right);
        if(right_node===undefined){
            right_node=new Node(right)
        }else {
            left_node = new Node("break")
        }
    }
    if (currNode.left===null&&left!==null){
        currNode.left = left_node;
    }
    if(currNode.right===null&&right!==null){
        currNode.right = right_node;
    }

}
//显示链表元素

function display () {
    var currNode = this.head;
    while ( !(currNode.next == null) ){
        console.log( currNode.next.element );
        currNode = currNode.next;
    }
}

//查找带删除节点的前一个节点

function findPrev( item ) {
    var currNode = this.head;
    while ( !( currNode.next == null) && ( currNode.next.element != item )){
        currNode = currNode.next;
    }
    return currNode;
}
//删除节点

function remove ( item ) {
    var prevNode = this.findPrev( item );
    if( !( prevNode.next == null ) ){
        prevNode.next = prevNode.next.next;
    }
}

exports.LList = LList
exports.Node = Node
