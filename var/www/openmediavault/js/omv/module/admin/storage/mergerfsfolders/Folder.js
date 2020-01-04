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
// require("js/omv/workspace/window/Form.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/form/field/plugin/FieldInfo.js")
// require("js/omv/module/admin/storage/mergerfsfolders/MergerfsCreatePolicyStore.js")

Ext.define('OMV.module.admin.storage.mergerfsfolders.Folder', {
    extend: 'OMV.workspace.window.Form',
    requires: [
        'OMV.form.field.plugin.FieldInfo',
        'OMV.workspace.window.plugin.ConfigObject',
        'OMV.module.admin.storage.mergerfsfolders.MergerfsCreatePolicyStore'
    ],

    plugins: [{
        ptype: 'configobject'
    }],

    hideResetButton: true,

    rpcService: 'MergerfsFolders',
    rpcGetMethod: 'get',
    rpcSetMethod: 'set',

    getFormItems: function() {
        return [{
            xtype: 'textfield',
            name: 'name',
            fieldLabel: _('Name'),
            allowBlank: false,
            readOnly: this.uuid !== OMV.UUID_UNDEFINED
        },{
            xtype: 'hiddenfield',
            name: 'mntentref',
            value: OMV.UUID_UNDEFINED
        },{
            xtype: 'textarea',
            name: 'paths',
            fieldLabel: _('Paths'),
            allowBlank: false,
            plugins: [{
                ptype: 'fieldinfo',
                text: _('Put each folder on a new line.')
            }],
            triggers: {
                folder: {
                    cls: Ext.baseCSSPrefix + "form-folder-trigger",
                    handler : "onTriggerClick"
                }
            },
            onTriggerClick : function() {
                Ext.create("OmvExtras.window.RootFolderBrowser", {
                    listeners : {
                        scope  : this,
                        select : function(wnd, node, path) {
                            // Set the selected path.
                            curPath = this.value;
                            if (curPath) {
                                curPath += '\n';
                            } 
                            this.setValue(curPath + path);
                        }
                    }
                }).show();
            }
        },{
            xtype: 'fieldset',
            title: _('Mount options'),
            defaults: {
                labelSeparator: ''
            },
            items: [{
                xtype: 'combo',
                name: 'create_policy',
                fieldLabel: _('Create policy'),
                queryMode: 'local',
                store: Ext.create('OMV.module.admin.storage.mergerfsfolders.MergerfsCreatePolicyStore'),
                displayField: 'text',
                valueField: 'value',
                allowBlank: false,
                editable: false,
                triggerAction: 'all',
                value: 'epmfs'
            }, {
                xtype: 'textfield',
                name: 'min_free_space',
                fieldLabel: _('Minimum free space'),
                allowBlank: false,
                maskRe: /[0-9KMG]/,
                regex: /^[0-9]+[KMG]$/,
                value: '4G',
                plugins: [{
                    ptype: 'fieldinfo',
                    text: _('When the minimum free space is reached on a filesystem it will not be written to unless all the other filesystem also has reached the limit. Format: {amount}{unit}. Allows the units K, M and G.')
                }]
            },{
                xtype: 'textfield',
                name: 'options',
                fieldLabel: _('Options'),
                value: 'defaults,allow_other,cache.files=off,use_ino'
            }]
        }];
    }
});
