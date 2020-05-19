<?php
/**
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2013 Volker Theile
 * @copyright Copyright (c) 2013-2020 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
require_once("openmediavault/globals.inc");
require_once("openmediavault/functions.inc");

class OMVRpcServiceMergerfsFolders extends \OMV\Rpc\ServiceAbstract
{
    public function getName()
    {
        return "MergerfsFolders";
    }

    public function initialize()
    {
        $this->registerMethod("getList");
        $this->registerMethod("get");
        $this->registerMethod("set");
        $this->registerMethod("delete");
    }

    public function getList($params, $context)
    {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, ["role" => OMV_ROLE_ADMINISTRATOR]);
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, "rpc.common.getlist");
        // Get the configuration object.
        $db = \OMV\Config\Database::getInstance();
        $objects = $db->getAssoc("conf.service.mergerfsfolders.folder");
        // Filter the result.
        return $this->applyFilter($objects, $params['start'], $params['limit'],
            $params['sortfield'], $params['sortdir']);
    }

    public function get($params, $context)
    {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, ["role" => OMV_ROLE_ADMINISTRATOR]);
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, "rpc.common.objectuuid");
        // Get the configuration object.
        $db = \OMV\Config\Database::getInstance();
        return $db->getAssoc("conf.service.mergerfsfolders.folder", $params['uuid']);
    }

    public function set($params, $context)
    {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, ["role" => OMV_ROLE_ADMINISTRATOR]);
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, "rpc.mergerfsfolders.set");
        // remove bad lines in paths
        $paths = explode(PHP_EOL, $params['paths']);
        foreach ($paths as $pathKey => &$path) {
            if (strlen($path) < 3) {
                unset($paths[$pathKey]);
            }
        }
        $params['paths'] = implode(PHP_EOL, $paths);
        // Prepare the configuration object.
        $object = new \OMV\Config\ConfigObject("conf.service.mergerfsfolders.folder");
        $object->setAssoc($params);
        // Set the configuration object.
        $isNew = $object->isNew();
        $db = \OMV\Config\Database::getInstance();
        if (TRUE === $isNew) {
            // Check uniqueness
            $db->assertIsUnique($object, "name");
            $db->assertIsUnique($object, "paths");
        }
        $db->set($object);
        // create mntent entry for new pools
        if (TRUE === $isNew) {
            $result = \OMV\Rpc\Rpc::call('FsTab', 'set', [
                'uuid' => $object->get('mntentref'),
                'fsname' => $object->get('uuid'),
                'dir' => \OMV\System\MountPoint::buildPath($object->get('uuid')),
                'type' => 'fuse.mergerfs',
                'opts' => '',
                'freq' => 0,
                'passno' => 0,
            ], $context);
            // update uuid in config
            $object->set('mntentref', $result['uuid']);
            $db->set($object);
        }
        // mark fstab dirty
        $moduleMngr = \OMV\Engine\Module\Manager::getInstance();
        $moduleMngr->setModuleDirty("fstab");
        // Return the configuration object.
        return $object->getAssoc();
    }

    public function delete($params, $context)
    {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, ["role" => OMV_ROLE_ADMINISTRATOR]);
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, "rpc.common.objectuuid");
        // Get the configuration object.
        $db = \OMV\Config\Database::getInstance();
        $object = $db->get("conf.service.mergerfsfolders.folder", $params['uuid']);
        // Delete the configuration object.
        $db->delete($object);
        // Delete the filesystem
        \OMV\Rpc\Rpc::call("FsTab", "delete", [
            "uuid" => $object->get("mntentref")
        ], $context);
        \OMV\Rpc\Rpc::call("Config", "applyChanges", [
            "modules" => [ "fstab" ],
            "force" => TRUE
        ], $context);
        // Return the deleted configuration object.
        return $object->getAssoc();
    }
}
