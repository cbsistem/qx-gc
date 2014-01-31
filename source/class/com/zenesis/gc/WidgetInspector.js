qx.Class.define("com.zenesis.gc.WidgetInspector", {
  extend: com.zenesis.gc.Inspector,
  
  construct: function() {
    this.base(arguments);
    qx.ui.core.Widget._afterAddChild = function(child) {
      com.zenesis.gc.GC.addReference(this, child);
    };
    qx.ui.core.Widget._afterRemoveChild = function(child) {
      com.zenesis.gc.GC.removeReference(this, child);
    };
  },
  
  members: {
    /*
     * @Override com.zenesis.gc.Inspector.gcIterate
     */
    gcIterate: function(obj, mark, context) {
      this.base(arguments, obj, mark, context);
      var children = obj._getChildren();
      for (var i = 0; i < children.length; i++)
        mark.call(context, children[i]);
    }

  }
});
