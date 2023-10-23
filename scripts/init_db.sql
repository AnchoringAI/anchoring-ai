CREATE TABLE t_user
(
    id            VARCHAR(36)  NOT NULL PRIMARY KEY UNIQUE DEFAULT (UUID()),
    username      VARCHAR(20)  NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    active        BOOLEAN      NOT NULL                    DEFAULT TRUE,
    authenticated BOOLEAN      NOT NULL                    DEFAULT TRUE,
    anonymous     BOOLEAN      NOT NULL                    DEFAULT FALSE,
    create_at     TIMESTAMP    NOT NULL                    DEFAULT CURRENT_TIMESTAMP
);

create index idx_user_id on t_user (id) using btree;
create index idx_user_username on t_user (username) using btree;

create table t_user_api_key
(
    id        varchar(36)       not null primary key,
    user_id   varchar(36)  not null,
    api_type  varchar(200) not null,
    api_key     varchar(200) not null,
    create_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid     boolean      not null
);
create index idx_api_key_userid on t_user_api_key (user_id);

CREATE TABLE t_user_quota (
    user_id VARCHAR(36) PRIMARY KEY,
    quota_available INT NOT NULL,
    quota_used INT NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_quota_user FOREIGN KEY (user_id) REFERENCES t_user(id)
);

CREATE INDEX idx_quota_updated_at ON t_user_quota (updated_at);

create table t_app
(
    id         varchar(36) primary key,
    app_name   varchar(200) not null comment 'app name',
    created_by varchar(36)  not null comment 'user id of creator',
    created_at DATETIME     not null,
    updated_at DATETIME     not null,
    tags       JSON,
    description       varchar(1000),
    chain      JSON,
    published  boolean      not null default false,
    deleted_at DATETIME,
    CONSTRAINT fk_app_user FOREIGN KEY (created_by) REFERENCES t_user (id)
);
create index idx_app_id on t_app (id);
create index idx_app_name on t_app (app_name);

CREATE TABLE t_file
(
    id          VARCHAR(36) PRIMARY KEY,
    name        VARCHAR(120),
    type        VARCHAR(50),
    uploaded_by varchar(36) not null comment 'user id of creator',
    uploaded_at TIMESTAMP,
    size        INTEGER,
    content     JSON,
    raw_content MEDIUMBLOB,
    published  boolean      not null default false,
    deleted_at  DATETIME,
    CONSTRAINT fk_file_user FOREIGN KEY (uploaded_by) REFERENCES t_user (id)
);

create index idx_file_id on t_file (id);
create index idx_file_user on t_file (uploaded_by);

create table t_task
(
    id          varchar(36) primary key,
    task_name   varchar(200) not null comment 'task name',
    created_by  varchar(36)  not null comment 'user id of creator',
    app_id      varchar(36)  not null comment 'app id of creator',
    file_id     varchar(36)  not null comment 'file id of creator',
    created_at  DATETIME     not null,
    status      INT          not null comment 'Task status 1: QUEUED, 2: RUNNING, 3: COMPLETED, 4: FAILED 5: STOPPED',
    completed_at DATETIME,
    published   boolean      not null default false,
    deleted_at  DATETIME,
    result      JSON,
    message     JSON,
    CONSTRAINT fk_task_user FOREIGN KEY (created_by) REFERENCES t_user (id),
    CONSTRAINT fk_task_app FOREIGN KEY (app_id) REFERENCES t_app (id),
    CONSTRAINT fk_task_file FOREIGN KEY (file_id) REFERENCES t_file (id)
);


create index idx_task_appid on t_task (app_id);
create index idx_task_fileid on t_task (file_id);
create index idx_task_userid on t_task (created_by);

CREATE TABLE t_embedding (
    id VARCHAR(36) primary key,
    embedding_name VARCHAR(200) NOT NULL COMMENT 'embedding name',
    created_by VARCHAR(36) NOT NULL COMMENT 'user id of creator',
    file_id VARCHAR(36) NOT NULL COMMENT 'file id of creator',
    config JSON,
    created_at DATETIME NOT NULL,
    status INT NOT NULL COMMENT 'Task status 1: QUEUED, 2: RUNNING, 3: COMPLETED, 4: FAILED 5: STOPPED',
    completed_at DATETIME,
    published  boolean      not null default false,
    deleted_at DATETIME,
    result JSON,
    message JSON,
    CONSTRAINT fk_embedding_user FOREIGN KEY (created_by) REFERENCES t_user(id),
    CONSTRAINT fk_embedding_file FOREIGN KEY (file_id) REFERENCES t_file(id)
);

-- CREATE TABLE t_user_quota_usage_log (
--     id VARCHAR(36) PRIMARY KEY,
--     user_id VARCHAR(36) NOT NULL,
--     used_at DATETIME NOT NULL,
--     amount_used INT NOT NULL,
--     CONSTRAINT fk_quota_usage_log_user FOREIGN KEY (user_id) REFERENCES t_user(id)
-- );

-- CREATE INDEX idx_quota_usage_log_used_at ON t_user_quota_usage_log (used_at);

CREATE TABLE t_shared_link
(
    id VARCHAR(36) NOT NULL PRIMARY KEY UNIQUE DEFAULT (UUID()), 
    created_by VARCHAR(36) NOT NULL, 
    resource_id VARCHAR(36) NOT NULL, 
    resource_type VARCHAR(20) NOT NULL, 
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    expires_at TIMESTAMP, 
    CONSTRAINT fk_shared_link_creator FOREIGN KEY (created_by) REFERENCES t_user (id) 
);

CREATE INDEX idx_shared_link_userid ON t_shared_link (created_by);
CREATE INDEX idx_shared_link_resource ON t_shared_link (resource_id);