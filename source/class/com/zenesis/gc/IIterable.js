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
 * Implemented by classes which can be iterated
 */
qx.Interface.define("com.zenesis.gc.IIterable", {
	members: {
		/**
		 * Called to iterate over references to an object
		 * @param mark {Function} the function to call with references
		 * @param context {Object} the 'this' context for mark
		 */
		gcIterate: function(mark, context) {
			
		}
	}
});