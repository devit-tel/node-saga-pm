import * as config from './config';
import * as store from './store';
import { WorkflowDefinitionZookeeperStore } from './store/zookeeper/workflowDefinition';
import { TaskDefinitionZookeeperStore } from './store/zookeeper/taskDefinition';
// import { MemoryStore } from './store/memory';
import { TaskInstanceMongooseStore } from './store/mongoose/taskInstance';
import { WorkflowInstanceMongoseStore } from './store/mongoose/workflowInstance';
import { Server } from './server';
import { executor as stateExecutor } from './state';
import { executor as systemTaskExecutor } from './systemTask';
import { executor as commandExecutor } from './command';
import { StoreType } from './constants/store';
import './kafka';
import { TransactionInstanceMongoseStore } from './store/mongoose/transactionInstance';

switch (config.workflowDefinitionStoreConfig.type) {
  case StoreType.ZooKeeper:
    store.workflowDefinitionStore.setClient(
      new WorkflowDefinitionZookeeperStore(
        config.workflowDefinitionStoreConfig.zookeeperConfig.root,
        config.workflowDefinitionStoreConfig.zookeeperConfig.connectionString,
        config.workflowDefinitionStoreConfig.zookeeperConfig.options,
      ),
    );
    break;
  default:
    throw new Error(
      `WorkflowDefinition Store: ${config.workflowDefinitionStoreConfig.type} is invalid`,
    );
}

switch (config.taskDefinitionStoreConfig.type) {
  case StoreType.ZooKeeper:
    store.taskDefinitionStore.setClient(
      new TaskDefinitionZookeeperStore(
        config.taskDefinitionStoreConfig.zookeeperConfig.root,
        config.taskDefinitionStoreConfig.zookeeperConfig.connectionString,
        config.taskDefinitionStoreConfig.zookeeperConfig.options,
      ),
    );
    break;
  default:
    throw new Error(
      `TaskDefinition Store: ${config.taskDefinitionStoreConfig.type} is invalid`,
    );
}

switch (config.transactionInstanceStoreConfig.type) {
  // case StoreType.Memory:
  //   store.transactionInstanceStore.setClient(new MemoryStore());
  //   break;
  case StoreType.MongoDB:
    store.transactionInstanceStore.setClient(
      new TransactionInstanceMongoseStore(
        config.transactionInstanceStoreConfig.mongoDBConfig.uri,
        config.transactionInstanceStoreConfig.mongoDBConfig.options,
      ),
    );
    break;
  default:
    throw new Error(
      `TranscationInstance Store: ${config.transactionInstanceStoreConfig.type} is invalid`,
    );
}

switch (config.workflowInstanceStoreConfig.type) {
  // case StoreType.Memory:
  //   store.workflowInstanceStore.setClient(new MemoryStore());
  //   break;
  case StoreType.MongoDB:
    store.workflowInstanceStore.setClient(
      new WorkflowInstanceMongoseStore(
        config.workflowInstanceStoreConfig.mongoDBConfig.uri,
        config.workflowInstanceStoreConfig.mongoDBConfig.options,
      ),
    );
    break;
  default:
    throw new Error(
      `WorkflowInstance Store: ${config.workflowInstanceStoreConfig.type} is invalid`,
    );
}

switch (config.taskInstanceStoreConfig.type) {
  // case StoreType.Memory:
  //   store.taskInstanceStore.setClient(new MemoryStore());
  //   break;
  case StoreType.MongoDB:
    store.taskInstanceStore.setClient(
      new TaskInstanceMongooseStore(
        config.taskInstanceStoreConfig.mongoDBConfig.uri,
        config.taskInstanceStoreConfig.mongoDBConfig.options,
      ),
    );
    break;
  default:
    throw new Error(
      `WorkflowInstance Store: ${config.taskInstanceStoreConfig.type} is invalid`,
    );
}

if (config.server.enabled) {
  new Server(config.server.port, config.server.hostname, true);
}

stateExecutor();
systemTaskExecutor();
commandExecutor();