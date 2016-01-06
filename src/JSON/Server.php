<?php

namespace JStormes\PHPSlickGrid;

class Server 
{
    /**
     * 
     * @var \JStormes\PHPSlickGrid\SlickGridInterface
     */
    public $model = null;
    
    function __construct($model) {
        $this->model = $model;
    }
    
    /**
     * Action to proxy all calls to the Application\Model\Hello Class
     */
    public function Action()
    {

    
        // New JSON RPS-Server.
        $server = new \Zend\Json\Server\Server();
    
        // Tell RPC Server to use model.
        $server->setClass($this->model);
    
        // Requst for list of Sevices/Methods.
        if ('GET' == $_SERVER['REQUEST_METHOD']) {
            // Indicate the URL endpoint, and the JSON-RPC version used:
            // $uri = $this->getRequest()->getUri();
            $uri = $_SERVER[REQUEST_URI];
            $server->setTarget($uri)
                ->setEnvelope(\Zend\Json\Server\Smd::ENV_JSONRPC_2);
    
            // Grab the SMD (Service Mapping Description)
            echo $server->getServiceMap();
    
            // Short circut the rest of the framework, we no longer need it.
            exit;
        }
    
        // Request for a service
        $server->handle();
    
        // Short circut the rest of the framework, we no longer need it.
        exit;
    }
}