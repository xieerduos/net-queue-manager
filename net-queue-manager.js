module.exports = class NetQueueManager {
    constructor(number) {
        if (!(typeof number === "number" && !Number.isNaN(number))) {
            console.error(
                "[error]: ",
                `NetQueueManager params typeof number === '${typeof number}', value: ${number}`
            );
        }

        this.number = number;

        this.data = {};

        this.DEFAULT_UUID = "abcdef";
    }

    handler = (current) => {
        const hits = current.queues.filter((i) => i.isFetch === false);

        hits.forEach((item) => {
            item.isFetch = true;

            item.task()

                .then(item.resolve)

                .catch(item.reject)

                .finally(() => {
                    const deleteIndex = current.queues.findIndex(
                        (del) => del.key === item.key
                    );

                    if (deleteIndex !== -1) {
                        current.queues.splice(deleteIndex, 1);
                    }

                    if (current.caches.length > 0) {
                        current.queues.push(current.caches.shift());

                        this.trigger();
                    }

                    Object.keys(this.data).forEach((item) => {
                        if (
                            this.data[item].queues.length === 0 &&
                            this.data[item].caches.length === 0
                        ) {
                            delete this.data[item];
                        }
                    });
                });
        });
    };

    trigger = () => {
        Object.keys(this.data).forEach((item) => {
            this.handler(this.data[item]);
        });
    };

    push = ({
        uuid = "abcdef",
        meta,
        key,
        fetch = () => Promise.resolve()
    }) => {
        return new Promise((resolve, reject) => {
            // 绑定一个函数并传参

            // const task = window.fetch.bind(null, ...reset);

            // 生成一个key值，用于删除队列任务，必须唯一

            key = key || Math.random().toString();

            const newItem = {
                meta,
                key,
                isFetch: false,
                task: fetch,
                resolve,
                reject
            };

            // 限制相同uuid并发数量
            if (
                this.data[uuid] &&
                Array.isArray(this.data[uuid].queues) &&
                this.data[uuid].queues.length >= this.number
            ) {
                this.data[uuid].caches.push(newItem);
            } else {
                if (this.data[uuid] && Array.isArray(this.data[uuid].queues)) {
                    this.data[uuid].queues.push(newItem);
                } else {
                    this.data[uuid] = {
                        queues: [newItem],
                        caches: []
                    };
                }

                this.trigger();
            }
        });
    };
    pushCachesIndexAfter = ({
        index,
        uuid = "abcdef",
        meta,
        key,
        fetch = () => Promise.resolve()
    }) => {
        return new Promise((resolve, reject) => {
            // 绑定一个函数并传参

            // const task = window.fetch.bind(null, ...reset);

            // 生成一个key值，用于删除队列任务，必须唯一

            key = key || Math.random().toString();

            const newItem = {
                meta,
                key,
                isFetch: false,
                task: fetch,
                resolve,
                reject
            };

            // 限制相同uuid并发数量
            if (
                this.data[uuid] &&
                Array.isArray(this.data[uuid].queues) &&
                this.data[uuid].queues.length >= this.number
            ) {
                this.data[uuid].caches.splice(index, 0, newItem);
            } else {
                if (this.data[uuid] && Array.isArray(this.data[uuid].queues)) {
                    this.data[uuid].queues.push(newItem);
                } else {
                    this.data[uuid] = {
                        queues: [newItem],
                        caches: []
                    };
                }
                this.trigger();
            }
        });
    };
    /**
     * 根据push的时候传入的uuid和key返回key是否存在于任务队列中
     * @param {String} uuid 队列名称，默认'abcdef', 有多个不同队列，需要显式的设置
     * @param {String} key key则是唯一的uuidv4，用于删除队列任务的uuid，如果需要该uuid，push的时候主动传入
     * @returns Boolean true 该任务已经存在于队列中，false不存在队列中
     */

    getTaskExistByKey = ({ uuid = "abcdef", key }) => {
        if (!key) {
            console.error("[error getTaskExistByKey key]", key);

            return false;
        }

        const task = this.data[uuid];

        if (task) {
            return !![...task?.caches, ...task?.queues].find(
                (item) => item?.key === key && key
            );
        }

        return false;
    };

    removeTaskByKey = ({ uuid = "abcdef", key }) => {
        if (!key) {
            console.error("[error removeTaskByKey key]", key);

            return false;
        }

        let output = false;

        const task = this.data[uuid];

        if (task) {
            if (Array.isArray(task.queues) && task.queues.length > 0) {
                const hitIndex = task.queues.findIndex(
                    (item) => item.key === key
                );

                if (hitIndex !== -1) {
                    task.queues.splice(hitIndex, 1);

                    output = true;
                }
            }

            if (Array.isArray(task.caches) && task.caches.length > 0) {
                const hitIndex = task.caches.findIndex(
                    (item) => item.key === key
                );

                if (hitIndex !== -1) {
                    task.caches.splice(hitIndex, 1);

                    output = true;
                }
            }

            output && this.trigger();
        }

        return output;
    };

    removeTaskByUuid = (params = {}) => {
        let output = false;

        const uuid = params?.uuid;

        if (!(params && typeof params === "object") || !uuid) {
            console.error("removeTaskByUuid uuid is required", params);

            output = false;
        } else {
            const task = this.data[uuid];

            if (task?.caches?.length > 0) {
                task.caches = [];

                output = true;
            }

            if (task?.queues?.length > 0) {
                task.queues = [];

                output = true;
            }
        }

        output && this.trigger();

        return output;
    };
};
