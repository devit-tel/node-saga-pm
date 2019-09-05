import * as mongoose from 'mongoose';
import * as mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { MongooseStore } from '../mongoose';
import { IWorkflow } from '../../workflow';
import { IWorkflowInstanceStore } from '../../store';
import { WorkflowPrevStates, WorkflowStates } from '../../constants/workflow';
import { IWorkflowUpdate } from '../../state';
import { TaskTypesList } from '../../constants/task';
import { taskInstanceStore } from '../../store';

const workflowSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      index: true,
    },
    retryCount: Number,
    input: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed,
    createTime: Date,
    startTime: Date,
    endTime: Date,
    workflowDefinition: {
      name: String,
      rev: String,
      description: String,
      tasks: [
        {
          _id: false,
          inputParameters: mongoose.Schema.Types.Mixed,
          name: String,
          taskReferenceName: String,
          type: {
            type: String,
            enum: TaskTypesList,
            required: true,
          },
          defaultDecision: [mongoose.Schema.Types.Mixed],
          decisions: mongoose.Schema.Types.Mixed,
          parallelTasks: [[mongoose.Schema.Types.Mixed]],
          workflow: {
            name: String,
            rev: String,
          },
          retry: {
            limit: Number,
            delay: Number,
          },
        },
      ],
      failureStrategy: String,
      retry: {
        limit: Number,
        delaySecond: Number,
      },
      recoveryWorkflow: {
        name: String,
        rev: String,
      },
    },
    childOf: {
      type: String,
      index: true,
    },
  },
  {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  },
);

workflowSchema
  .virtual('workflowId')
  .get(function() {
    return this._id;
  })
  .set(function() {
    return this._id;
  });

workflowSchema.plugin(mongooseLeanVirtuals);

export class WorkflowInstanceMongoseStore extends MongooseStore
  implements IWorkflowInstanceStore {
  constructor(uri: string, mongoOption: mongoose.ConnectionOptions) {
    super(uri, mongoOption, 'workflow-instance', workflowSchema);
  }

  get = async (workflowId: string): Promise<IWorkflow> => {
    return this.model
      .findOne({ _id: workflowId })
      .lean({ virtuals: true })
      .exec();
  };

  create = async (workflowData: IWorkflow): Promise<IWorkflow> => {
    return {
      ...workflowData,
      ...(await this.model.create(workflowData)).toObject(),
    };
  };

  update = async (workflowUpdate: IWorkflowUpdate): Promise<IWorkflow> => {
    if (
      [
        WorkflowStates.Failed,
        WorkflowStates.Completed,
        WorkflowStates.Timeout,
      ].includes(workflowUpdate.status)
    ) {
      // Final state just remove them from cache state
      const deletedWorkflow = await this.model
        .findOneAndDelete({
          _id: workflowUpdate.workflowId,
          status: WorkflowPrevStates[workflowUpdate.status],
        })
        .lean({ virtuals: true })
        .exec();

      if (deletedWorkflow)
        taskInstanceStore.deleteAll(workflowUpdate.workflowId);

      return deletedWorkflow;
    } else {
      return this.model
        .update(
          {
            _id: workflowUpdate.workflowId,
            status: WorkflowPrevStates[workflowUpdate.status],
          },
          {
            status: workflowUpdate.status,
            output: workflowUpdate.output,
          },
          {
            new: true,
          },
        )
        .lean({ virtuals: true })
        .exec();
    }
  };

  delete = (workflowId: string): Promise<any> =>
    this.model
      .deleteOne({ _id: workflowId })
      .lean({ virtuals: true })
      .exec();
}