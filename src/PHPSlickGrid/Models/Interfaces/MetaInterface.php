<?php

namespace JStormes\PHPSlickGrid\Models\Interfaces;

interface MetaInterface
{
    /**
     * Get an array of columns for the model
     */
    public function getColumns();
    
    /**
     * Get details of a specific colum for the model
     * @param column name $name
     */
    public function getColumn($name);
}