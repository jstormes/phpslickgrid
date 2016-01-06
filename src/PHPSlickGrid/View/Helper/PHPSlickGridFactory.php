<?php

namespace JStormes\PHPSlickGrid\View\Helper;

use JStormes\PHPSlickGrid\View\Helper\PHPSlickGridHelper;
use Zend\ServiceManager\FactoryInterface;
use \Zend\ServiceManager\ServiceLocatorInterface;


class PHPSlickGridFactory implements FactoryInterface
{
    public function createService(ServiceLocatorInterface $serviceLocator)
    {
        // $sl is instanceof ViewHelperManager, we need the real SL though
        $rsl = $serviceLocator->getServiceLocator();
        //$foo = $rsl->get('foo');
        //$bar = $rsl->get('bar');
        //$Table = $rsl->get('bar');

        return new PHPSlickGridHelper("test");
    }
}
