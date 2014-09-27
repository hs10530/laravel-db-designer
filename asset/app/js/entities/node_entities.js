DesignerApp.module("NodeEntities", function(NodeEntities, DesignerApp, Backbone, Marionette, $, _) {
    // Private
    // -------------------------
    //todo parameter .......

    // Public
    // -------------------------
    //
    //    1.NodeCanvas (col)
    //        *NodeContainer (model) -> composite view
    //          1.NodeCollection (col) -> NodeModel
    //          2.RelationCollection (col) -> RelationModel
    //          .....
    //

    /* NodeModel
	{
	  "name" : "id",
	  "type" : "increments",
	  "length" : 30,
	  "order" : 0,
	  "defaultvalue" : "",
	  "enumvalue" : ""
	}
	*/
    var NodeModel = Backbone.Model.extend({
        defaults: {
            name: '',
            type: '',
            length: 0,
            defaultvalue: '',
            enumvalue: ''
        }
    });

    var NodeCollection = Backbone.Collection.extend({
        model: NodeModel,
        comparator: "order"
    });

    /* RelationModel
	{
	  "extramethods" : "",
	  "foreignkeys" : "user_id",
	  "name" : "machines",
	  "relatedmodel" : "Roles",
	  "relationtype" : "hasMany",
	  "usenamespace" : ""
	}
	*/
    var RelationModel = Backbone.Model.extend({
        defaults: {
            name: '',
            relationtype: '',
            usenamespace: '',
            relatedmodel: '',
            foreignkeys: '',
            extramethods: ''
        }
    });

    var RelationCollection = Backbone.Collection.extend({
        model: RelationModel
    });


    //
    //  Name
    //  Color
    //  position (x,y)
    //  NodeCollection*
    //  RelationCollection*
    //

    var NodeContainer = Backbone.Model.extend({});

    var NodeCanvas = Backbone.Collection.extend({
        model: NodeContainer
    });

    var nodeCanvas = new NodeCanvas();

    NodeEntities.getNewNodeModel = function() {
        return new NodeModel();
    };

    NodeEntities.getNewRelationModel = function() {
        return new RelationModel();
    };


    NodeEntities.getNodeCanvas = function() {
        return nodeCanvas;
    };

    NodeEntities.getNodeContainerFromNodeCid = function(modelcid) {
        return nodeCanvas.get(modelcid);
    };

    NodeEntities.getNodeContainerFromNodeName = function(modelname) {
        return nodeCanvas.where({
            name: modelname
        })[0];
    };

    NodeEntities.AddNewNode = function(param) {
        var nodeContainer = new NodeContainer(param);
        var col = nodeContainer.get("column"); //NodeCollection
        var rel = nodeContainer.get("relation"); //RelationCollection
        nodeContainer.set("column", new NodeCollection(col));
        nodeContainer.set("relation", new NodeCollection(rel));
        nodeCanvas.add(nodeContainer);
    };

    NodeEntities.AddNewRelation = function(nodeCanvasParam) {
        nodeCanvas.each(function(node) {
            var relations = node.get("relation");
            relations.each(function(relation) {
                //console.log(relation);
                var srcName = node;
                var dstName = relation;

                var targetNodeContainer = NodeEntities.getNodeContainerFromNodeName(relation.get("relatedmodel"));

                var raiseVent = function(evName) {
                    DesignerApp.vent.trigger("noderelation:" + evName, {
                        srcNodeContainer: srcName,
                        dstRelation: dstName
                    });
                    //console.log(evName);
                };
                //on delete node also delte referenced relation

                relation.on('change:relatedmodel', function() {
                    relation.stopListening();

                    var targetModel = NodeEntities.getNodeContainerFromNodeName(relation.get("relatedmodel"));
                    relation.listenTo(targetModel, "destroy", function() {
                        raiseVent("destroyme");
                        relation.destroy();
                    });
                    raiseVent("change");
                });

                relation.on("change:relationtype", function(){
                    raiseVent("redraw");
                });

                relation.listenTo(targetNodeContainer, "destroy", function() {
                    raiseVent("destroy");
                    relation.destroy();
                });

                relation.on("destroy", function() {
                    raiseVent("destroy");
                    relation.stopListening();
                    relation.off();
                    relation.destroy();
                });

                raiseVent("add");
            });
        });
    };

    NodeEntities.AddNodeCanvas = function(nodeCanvasParam) {
        for (var node in nodeCanvasParam) {
            NodeEntities.AddNewNode(nodeCanvasParam[node]);
        }
        NodeEntities.AddNewRelation();
    };

    // Initializers
    // -------------------------



});