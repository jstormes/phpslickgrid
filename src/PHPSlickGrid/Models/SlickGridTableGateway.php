<?php


namespace JStormes\PHPSlickGrid\Models;

use Zend\Db\TableGateway\TableGateway;

class SlickGridTableGateway extends AbstractSlickGridGateway
{
    /**
     *
     * @var Zend\Db\TableGateway\TableGateway
     */
    protected $tableGateway=null;
    
    /**
     * 
     * @var \Zend\Db\Zend\Db\Adapter\AdapterInterface
     */
    protected $adapter=null;
    
    /**
     * 
     * @var string
     */
    protected $tableName = null;
    
    public function __construct($tableName,  $adapter, $features = null,  $resultSetPrototype = null,  $sql = null) {
        
        $this->tableName = $tableName;
        $this->adapter = $adapter;
        $this->tableGateway = new TableGateway($tableName, $adapter, $features, $resultSetPrototype, $sql);
        
    }
    
    
    
    public function getColumns() {
        
        // Columns to return
        $columns = array();
        
        // show full columns from table
        $statement = $this->adapter->query('show full columns from '.$this->tableName);
        $results = $statement->execute();
        
        // Loop over the each column as row.
        foreach ($results as $row) {
            
            // Set the minimum required values for SlickGrid colums
            $column = array('id'=>$row['Field'], 'name'=>$row['Field'], 'field'=>$row['Field']);
            
            // Copy all the schema options into the column
            foreach($row as $key=>$value) {
                if ($key!='Comment')
                    $column[strtolower($key)]=$value;
            }

            // If the comments are not empty try json_decode and use as column options.
            if (!empty($row['Comment'])) {               
                if ($options = json_decode($row['Comment'], true)) {
                    foreach($options as $key=>$value) {
                        $column[$key] = $value;
                    }
                }
            }
            // Add to return array.
            $columns[] = $column;
        }
        
        return $columns;
    }
    
    /**
     * 
     * @return multitype:boolean number
     */
    public function getOptions() {
        
        $options = array();
        
        // Set defaults
        $options['enableCellNavigation']=true;
        $options['enableColumnReorder']=true;
        $options['forceFitColumns']=true;
        $options['rowHeight']=35;
        
        return $options;
    }
    
    /**
     * 
     * @return multitype:
     */
    public function getData() {
        
        $rows = $this->tableGateway->select();
        
        if ($rows)
            return $rows->toArray();
        
        return array();
        
    }
    
}