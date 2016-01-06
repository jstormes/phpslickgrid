<?php

namespace JStormes\PHPSlickGrid\Models\Interfaces;


/**
 * Anything that maniplated the data but not the structure; SELECT,
 * INSERT, UPDATE, DELETE for example.
 * 
 * @author jstormes
 *
 */
interface DMLInterface
{
    /**
     * Get a dataset
     * 
     * @param unknown $filters
     */
    public function getDataset($filters=null, $sort=null, $start=null, $end=null);
    
    public function getRowByPrimaryKey($keyVaue);

    /**
     * Add a row to the data set
     * 
     * @param row of data $row
     */
    public function insertRow($row);
    
    public function updateRow($row);
    
    public function deleteRow($row);
    
    public function getRowCount($filters=null);
}