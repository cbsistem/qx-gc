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

/**
 * Implemented by classes which can look inside instances of another class and detect 
 * what references that object has
 */
qx.Interface.define("com.zenesis.gc.IInspector", {
	members: {
		/**
		 * Called to iterate over references to an object
		 * @param obj {qx.core.Object} the object to iterate over
		 * @param mark {Function} the function to call with references
		 * @param context {Object} the 'this' context for mark
		 */
		gcIterate: function(obj, mark, context) {
			
		},
		
		/**
		 * Called to get a property value from an object
		 * @param obj {qx.core.Object} the object to get the value from 
		 * @param name {String} the name of the property
		 */
		gcGetPropertyValue: function(obj, name) {
			
		},
		
		/**
		 * Called when a new instance of the class is created
		 * @param value {qx.core.Object} the object that was just created
		 */
		gcCreate: function(value) {
			
		},
		
		/**
		 * Called when an instance of the class is disposed
		 * @param value
		 */
		gcDispose: function(value) {
			
		}
	}
});