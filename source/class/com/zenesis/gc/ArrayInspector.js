qx.Class.define("com.zenesis.gc.ArrayInspector", {
	extend: qx.core.Object,
	implement: [ com.zenesis.gc.IInspector ],
	
	members: {
		__onChange: function(evt) {
			var GC = com.zenesis.gc.GC;
			var data = evt.getData();
			
			if (data.type === "add") {
				for (var i = 0; i < data.items.length; i++) {
					GC.addReference(this, data.items[i]);
				}
				
			} else if (data.type === "remove") {
				for (var i = 0; i < data.items.length; i++) {
					GC.removeReference(this, data.items[i]);
				}
			}
		},
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcIterate
		 */
		gcIterate: function(obj, mark, context) {
			for (var i = 0; i < obj.getLength(); i++) {
				var value = obj.getItem(i);
				if (value)
					mark.call(context, value);
			}
		},
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcCreate
		 */
		gcCreate: function(value) {
			value.addListener("change", this.__onChange);
		},
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcDispose
		 */
		gcDispose: function(value) {
			value.removeListener("change", this.__onChange);
		}
	}
});