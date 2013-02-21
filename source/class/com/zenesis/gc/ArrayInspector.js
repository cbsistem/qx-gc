/* ************************************************************************

   qx-gc - a contrib to the Qooxdoo project (http://qooxdoo.org/)

   http://qooxdoo.org

   Copyright:
     2012 Zenesis Limited, http://www.zenesis.com

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     
     This software is provided under the same licensing terms as Qooxdoo,
     please see the LICENSE file in the Qooxdoo project's top-level directory 
     for details.

   Authors:
     * John Spackman (john.spackman@zenesis.com)

************************************************************************ */

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
		 * @Override com.zenesis.gc.Inspector.gcGetPropertyValue
		 */
		gcGetPropertyValue: function(obj, name) {
			// Get the current property value; this can have side effects, EG if
			//	the property is not yet initialised an exception is raised
			var get = this["get" + qx.lang.String.firstUp(name)];
			var oldValue = undefined;
			try {
				oldValue = get.call(this);
			} catch(e) {
				// Nothing
			}
			return oldValue;
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