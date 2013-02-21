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

qx.Class.define("com.zenesis.gc.Inspector", {
	extend: qx.core.Object,
	implement: [ com.zenesis.gc.IInspector ],
	
	members: {
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcIterate
		 */
		gcIterate: function(obj, mark, context) {
			var properties = com.zenesis.gc.Inspector.getProperties(obj.constructor);
			for (var name in properties) {
				var prop = properties[name];
				var value = prop.get.call(obj);
				if (value)
					mark.call(context, value);
			}
		},
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcGetPropertyValue
		 */
		gcGetPropertyValue: function(obj, name) {
			var properties = com.zenesis.gc.Inspector.getProperties(obj.constructor);
			var prop = properties[name];
			var oldValue = undefined;
			if (prop) {
				// Get the current property value; this can have side effects, EG if
				//	the property is not yet initialised an exception is raised
				try {
					oldValue = prop.get.call(this);
				} catch(e) {
					// Nothing
				}
			}
			return oldValue;
		},
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcCreate
		 */
		gcCreate: function(value) {
		},
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcDispose
		 */
		gcDispose: function(value) {
		}
	},
	
	statics: {
		getProperties: function(clz) {
			if (clz.hasOwnProperty("$$gc_properties"))
				return clz.$$gc_properties;
			
			var properties = {};
			for (var tmp = clz.prototype; tmp; tmp = tmp.superclass) {
				if (tmp.hasOwnProperty("$$gc_properties")) {
					properties = qx.lang.Object.clone(tmp.$$gc_properties);
					break;
				}
			}
			
			var names = qx.Class.getProperties(clz);
			for (var i = 0; i < names.length; i++) {
				var name = names[i];
				var def = qx.Class.getPropertyDefinition(clz, name);
				
				// If there is a "check" then try to exclude the property from checks
				if (def.check) {
					// Some checks imply there is no ref counting to be done
					if (com.zenesis.gc.Inspector.IGNORE_CHECKS[def.check])
						continue;
				}
				
				// Add the property
				properties[name] = {
					get: clz.prototype["get" + qx.lang.String.firstUp(name)]	
				};
			}
			
			return clz.$$gc_properties = properties;
		},
		
		/** 
		 * Values which can appear in a property definition's "check" that mean we cannot do garbage
		 * collection.
		 */
		IGNORE_CHECKS: {
		      "Boolean"   : true,
		      "String"    : true,

		      "Number"    : true,
		      "Integer"   : true,
		      "PositiveNumber" : true,
		      "PositiveInteger" : true,

		      "Error"     : true,
		      "RegExp"    : true,

		      "Function"  : true,
		      "Date"      : true,
		      "Node"      : true,
		      "Element"   : true,
		      "Document"  : true,
		      "Window"    : true,
		      "Event"     : true,

		      "Class"     : true,
		      "Mixin"     : true,
		      "Interface" : true,
		      "Theme"     : true,

		      "Color"     : true,
		      "Decorator" : true,
		      "Font"      : true
		}
	}
});