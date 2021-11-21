{% set config = salt['omv_conf.get']('conf.service.mergerfsfolders') %}

{% for pool in config.folder %}
{% set poolmount = salt['omv_conf.get_by_filter'](
  'conf.system.filesystem.mountpoint',
  {'operator':'stringEquals', 'arg0':'uuid', 'arg1':pool.mntentref}) %}
{% set mntDir = poolmount[0].dir %}
{% set mount = True %}
{% if salt['mount.is_mounted'](mntDir) %}
  {% set mount = False %}
{% endif %}
{% set options = [] %}
{% set _ = options.append('category.create=' + pool.create_policy) %}
{% set _ = options.append('minfreespace=' + pool.min_free_space) %}
{% set _ = options.append('fsname=' + pool.name + ':' + pool.uuid) %}
{% for option in pool.options.split(',') %}
{% set _ = options.append(option) %}
{% endfor %}

{% set branches = [] %}
{% set branchDirs = pool.paths.split('\n') %}
{% for dir in branchDirs %}
{% if dir | length > 2 %}
{% set _ = branches.append(dir) %}
{% if '*' not in dir %}
{% set parent = salt['cmd.shell']('findmnt --first-only --noheadings --output TARGET --target ' + dir) %}
{% if 'xsystemd' in pool and not pool.xsystemd %}
{% if parent | length > 1 %}
{% set _ = options.append('x-systemd.requires=' + parent) %}
{% endif %}
{% endif %}
{% endif %}
{% endif %}
{% endfor %}

create_mergerfsfolder_mountpoint_{{ pool.mntentref }}:
  file.accumulated:
    - filename: "/etc/fstab"
    - text: "{{ branches | join(':') }}\t\t{{ mntDir }}\tfuse.mergerfs\t{{ options | join(',') }}\t0 0"
    - require_in:
      - file: append_fstab_entries

mount_filesystem_mountpoint_{{ pool.mntentref }}:
  mount.mounted:
    - name: {{ mntDir }}
    - device: {{ branches | join(':') }}
    - fstype: "fuse.mergerfs"
    - opts: {{ options }}
    - mkmnt: True
    - persist: False
    - mount: {{ mount }}
{% endfor %}
