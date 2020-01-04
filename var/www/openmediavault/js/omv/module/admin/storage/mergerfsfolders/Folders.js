/**
 * Copyright (C) 2014-2020 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/grid/Panel.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/data/proxy/Rpc.js")
// require("js/omv/module/admin/storage/mergerfsfolders/Folder.js")

Ext.define('OMV.module.admin.storage.mergerfsfolders.Folders', {
    extend: 'OMV.workspace.grid.Panel',
    requires: [
        'OMV.data.Store',
        'OMV.data.Model',
        'OMV.data.proxy.Rpc',
        'OMV.module.admin.storage.mergerfsfolders.Folder'
    ],

    hidePagingToolbar: false,
    reloadOnActivate: true,

    columns: [{
        xtype: 'textcolumn',
        header: _('UUID'),
        hidden: true,
        dataIndex: 'uuid'
    }, {
        xtype: 'textcolumn',
        header: _('Name'),
        flex: 1,
        sortable: true,
        dataIndex: 'name'
    }, {
        xtype: 'textcolumn',
        header: _('Paths'),
        flex: 1,
        sortable: true,
        dataIndex: 'paths',
        renderer: 'paths'
    }],

    store: Ext.create('OMV.data.Store', {
        autoLoad: true,
        model: OMV.data.Model.createImplicit({
            idProperty: 'uuid',
            fields: [
                { name: 'uuid', type: 'string' },
                { name: 'name', type: 'string' },
                { name: 'paths', type: 'string' }
            ]
        }),
        proxy: {
            type: 'rpc',
            rpcData: {
                'service': 'MergerfsFolders',
                'method': 'getList'
            }
        }
    }),

    onAddButton: function() {
        Ext.create('OMV.module.admin.storage.mergerfsfolders.Folder', {
            title: _('Add folder'),
            uuid: OMV.UUID_UNDEFINED,
            listeners: {
                scope: this,
                submit: function() {
                    this.doReload();
                }
            }
        }).show();
    },

    onEditButton: function() {
        var record = this.getSelected();

        Ext.create('OMV.module.admin.storage.mergerfsfolders.Folder', {
            title: _('Edit folder'),
            uuid: record.get('uuid'),
            listeners: {
                scope: this,
                submit: function() {
                    this.doReload();
                    OMV.MessageBox.info(null, _('NOTE: The changes won\'t take effect until you\'ve restarted the system or manually remounted the filesystem.'));
                }
            }
        }).show();
    },

    doDeletion: function(record) {
        OMV.Rpc.request({
            scope: this,
            callback: this.onDeletion,
            rpcData: {
                service: 'MergerfsFolders',
                method: 'delete',
                params: {
                    uuid: record.get('uuid')
                }
            }
        });
    }
});

OMV.WorkspaceManager.registerPanel({
    id: 'folders',
    path: '/storage/mergerfsfolders',
    text: _('Folders'),
    position: 10,
    className: 'OMV.module.admin.storage.mergerfsfolders.Folders'
});
