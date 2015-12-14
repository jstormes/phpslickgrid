# NOTICE:
I am in the process of changeing this to work with ZF2.  The current version is broken until I get conversion done.


# Welcome to PHPSlickGrid

## PHPSlickGrid provides server side support for using SlickGrid in PHP/Zend Framework 1.12

Find the outstanding SlickGrid component at [SlickGrid](https://github.com/mleibman/SlickGrid).

**Some highlights:**

* Lazy loading of data to the browser (only a small amount of data is kept browser side)
* Create grids quickly by reflecting MySQL tables to gird view
* Supports multi-column sort by passing the sort request back to MySQL
* Multi-user AJAX updates so all users see the same data near real time
* Zend 1.x integration
* Full CRUD (Create, Read, Update, Delete) support
* Support for millions of rows

**Implementation**

On the server side the data is feed to the browser from an extended version of `Zend_Db_Table_Abstract` called `PHPSlickGrid_Db_Table`.  This class uses the underlying SQL Schema as the bases for building the SlickGrid configuration.  The concept is that creating a SlickGrid in the view should be as easy a creating a table in MySQL, but if needed the model can much more complex. 


Ideas:

1) Make grids consumable by MS-Office:
http://office.microsoft.com/en-us/excel-help/get-external-data-from-a-web-page-HA010218472.aspx#BMmake_a_web_page_redirect_a_web_query_

This grid is just another place for the users stuff ;)

www.youtube.com/watch?v=JLoge6QzcGY

