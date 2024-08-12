# **CompletionResponse**

**Returns** the App result, **Content-Type** is **application/json**.

- **workflow_run_id** (string): **Unique ID** of workflow execution
- **task_id** (string): **Task ID**, used for request tracking and the below **Stop Generate API**
- **data** (object): **Detail** of result
  - **id** (string): **ID** of workflow execution
  - **workflow_id** (string): **ID** of related workflow
  - **status** (string): **Status** of execution, **running / succeeded / failed / stopped**
  - **outputs** (json): **Optional content** of output
  - **error** (string): **Optional reason** of error
  - **elapsed_time** (float): **Optional total seconds** to be usedmarkedown preview
  
  - **total_tokens** (int): **Optional tokens** to be used
  - **total_steps** (int): **Default** 0
  - **created_at** (timestamp): **Start time**
  - **finished_at** (timestamp): **End time**

# ChunkCompletionResponse

Returns the stream chunks outputted by the App, Content-Type is text/event-stream. Each streaming chunk starts with `data:`, separated by two newline characters `\n\n`, as shown below:


The structure of the streaming chunks varies depending on the event:

### Event: `workflow_started`
- **task_id** (string): Task ID, used for request tracking and the below Stop Generate API
- **workflow_run_id** (string): Unique ID of workflow execution
- **event** (string): Fixed to `workflow_started`
- **data** (object): Detail
  - **id** (string): Unique ID of workflow execution
  - **workflow_id** (string): ID of related workflow
  - **sequence_number** (int): Self-increasing serial number, starting from 1
  - **created_at** (timestamp): Creation timestamp, e.g., 1705395332

### Event: `node_started`
- **task_id** (string): Task ID, used for request tracking and the below Stop Generate API
- **workflow_run_id** (string): Unique ID of workflow execution
- **event** (string): Fixed to `node_started`
- **data** (object): Detail
  - **id** (string): Unique ID of workflow execution
  - **node_id** (string): ID of node
  - **node_type** (string): Type of node
  - **title** (string): Name of node
  - **index** (int): Execution sequence number, used to display Tracing Node sequence
  - **predecessor_node_id** (string): Optional prefix node ID, used for canvas display execution path
  - **inputs** (array[object]): Contents of all preceding node variables used in the node
  - **created_at** (timestamp): Timestamp of start, e.g., 1705395332

### Event: `node_finished`
- **task_id** (string): Task ID, used for request tracking and the below Stop Generate API
- **workflow_run_id** (string): Unique ID of workflow execution
- **event** (string): Fixed to `node_finished`
- **data** (object): Detail
  - **id** (string): Unique ID of workflow execution
  - **node_id** (string): ID of node
  - **node_type** (string): Type of node
  - **title** (string): Name of node
  - **index** (int): Execution sequence number, used to display Tracing Node sequence
  - **predecessor_node_id** (string): Optional prefix node ID, used for canvas display execution path
  - **inputs** (array[object]): Contents of all preceding node variables used in the node
  - **process_data** (json): Optional node process data
  - **outputs** (json): Optional content of output
  - **status** (string): Status of execution, running / succeeded / failed / stopped
  - **error** (string): Optional reason of error
  - **elapsed_time** (float): Optional total seconds to be used
  - **execution_metadata** (json): Metadata
  - **total_tokens** (int): Optional tokens to be used
  - **total_price** (decimal): Optional total cost
  - **currency** (string): Optional, e.g., USD / RMB
  - **created_at** (timestamp): Timestamp of start, e.g., 1705395332

### Event: `workflow_finished`
- **task_id** (string): Task ID, used for request tracking and the below Stop Generate API
- **workflow_run_id** (string): Unique ID of workflow execution
- **event** (string): Fixed to `workflow_finished`
- **data** (object): Detail
  - **id** (string): ID of workflow execution
  - **workflow_id** (string): ID of related workflow
  - **status** (string): Status of execution, running / succeeded / failed / stopped
  - **outputs** (json): Optional content of output
  - **error** (string): Optional reason of error
  - **elapsed_time** (float): Optional total seconds to be used
  - **total_tokens** (int): Optional tokens to be used
  - **total_steps** (int): Default 0
  - **created_at** (timestamp): Start time
  - **finished_at** (timestamp): End time

### Event: `tts_message`
- **task_id** (string): Task ID, used for request tracking and the stop response interface below
- **message_id** (string): Unique message ID
- **audio** (string): The audio after speech synthesis, encoded in base64 text content; when playing, simply decode the base64 and feed it into the player
- **created_at** (int): Creation timestamp, e.g.: 1705395332

### Event: `tts_message_end`
- **task_id** (string): Task ID, used for request tracking and the stop response interface below
- **message_id** (string): Unique message ID
- **audio** (string): The end event has no audio, so this is an empty string
- **created_at** (int): Creation timestamp, e.g.: 1705395332

### Event: `ping`
- **Description**: Ping event every 10 seconds to keep the connection alive.

### Errors
- **400, invalid_param**: Abnormal parameter input
- **400, app_unavailable**: App configuration unavailable
- **400, provider_not_initialize**: No available model credential configuration
- **400, provider_quota_exceeded**: Model invocation quota insufficient
- **400, model_currently_not_support**: Current model unavailable
- **400, workflow_request_error**: Workflow execution failed
- **500, internal server error**