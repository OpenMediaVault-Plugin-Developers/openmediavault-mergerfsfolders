{% set config = salt['omv_conf.get']('conf.service.mergerfsfolders') %}

{% for pool in config.folders.folder %}
{% set poolmount = salt['omv_conf.get_by_filter'](
  'conf.system.filesystem.mountpoint',
  {'operator':'stringEquals', 'arg0':'uuid', 'arg1':pool.mntentref}) %}
{% set mntDir = poolmount[0].dir %}

{% set options = [] %}
{% set options = pool.options.split(',') %}
{% set _ = options.append('category.create=' + pool.create_policy) %}
{% set _ = options.append('minfreespace=' + pool.min_free_space) %}

{% set branches = [] %}
{% set branchDirs = pool.paths.split('\n') %}
{% for dir in branchDirs | length > 2 %}
{% set _ = branches.append(dir) %}
{% set _ = options.append('x-systemd.requires=' + dir) %}
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
    - mount: True
{% endfor %}
