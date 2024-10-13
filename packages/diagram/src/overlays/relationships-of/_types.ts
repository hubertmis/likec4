import type { ComputedNode, Fqn, NodeId, Relation } from '@likec4/core'
import type { Edge as ReactFlowEdge, Node as ReactFlowNode, ReactFlowInstance } from '@xyflow/react'
import type { SetRequired } from 'type-fest'

export namespace XYFlowTypes {
  /**
   * Handle in ReactFlow terms
   */
  export type Port = {
    id: string
    type: 'in' | 'out'
  }

  type NodeProps = {
    // level: number
    column: 'incomers' | 'subject' | 'outgoers'
    fqn: Fqn
    existsInCurrentView: boolean
    element: Pick<ComputedNode, 'color' | 'title' | 'description' | 'shape' | 'kind'>
    ports: {
      left: Port[]
      right: Port[]
    }
  }

  export type ElementNode = SetRequired<ReactFlowNode<NodeProps, 'element'>, 'type'>

  export type CompoundNode = SetRequired<ReactFlowNode<NodeProps, 'compound'>, 'type'>

  export type NonEmptyNode = ElementNode | CompoundNode

  export type EmptyNode = SetRequired<
    ReactFlowNode<{
      column: 'incomers' | 'outgoers'
    }, 'empty'>,
    'type'
  >

  export type Node = NonEmptyNode | EmptyNode

  // export type InternalNode = ReactFlowInternalNode<Node>

  export type Edge = Omit<ReactFlowEdge, 'data' | 'type'> & {
    data: {
      relations: [Relation, ...Relation[]]
    }
    type: 'relation'
  }

  export type Instance = ReactFlowInstance<Node, Edge>
  // export type XYFlowState = ReactFlowState<XYFlowNode, XYFlowEdge>
}
