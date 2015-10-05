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

/* ************************************************************************

@asset(com/zenesis/gc/*)

************************************************************************ */

/**
 * This is the main application class of your custom application "com.zenesis.gc"
 */
qx.Class.define("com.zenesis.gc.test.Application",
{
  extend : qx.application.Standalone,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * This method contains the initial application code and gets called 
     * during startup of the application
     * 
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      new com.zenesis.gc.test.DemoTest().testSimple1();
      new com.zenesis.gc.test.DemoTest().testSimple2();
      new com.zenesis.gc.test.DemoTest().testPromotion1();
      new com.zenesis.gc.test.DemoTest().testGen1();
      new com.zenesis.gc.test.DemoTest().testLarge1();
      new com.zenesis.gc.test.DemoTest().testLarge2();
      alert("All tests passed!");
    }
  }
});
