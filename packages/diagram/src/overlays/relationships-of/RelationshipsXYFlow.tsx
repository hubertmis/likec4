import { isAncestor } from '@likec4/core'
import {
  Box,
  Button,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  SegmentedControl,
  Space,
  Text,
  ThemeIcon
} from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { useDebouncedEffect } from '@react-hookz/web'
import { IconAlertCircle, IconSelector } from '@tabler/icons-react'
import { Panel, ReactFlow, useReactFlow, useStoreApi } from '@xyflow/react'
import { memo, useEffect, useRef } from 'react'
import { useOverlayDialog } from '../../components'
import type { XYFlowTypes } from './_types'
import { useLayoutedRelationships, ZIndexes } from './use-layouted-relationships'
import { CompoundNode } from './xyflow/CompoundNode'
import { ElementNode } from './xyflow/ElementNode'
import { EmptyNode } from './xyflow/EmptyNode'
import { RelationshipEdge } from './xyflow/RelationshipEdge'

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode,
  empty: EmptyNode
}
const edgeTypes = {
  relation: RelationshipEdge
}

const animateEdge = (node: XYFlowTypes.Node, animated = true) => (edges: XYFlowTypes.Edge[]) =>
  edges.map(edge => {
    if (
      edge.source === node.id
      || edge.target === node.id
      || isAncestor(node.id, edge.source)
      || isAncestor(node.id, edge.target)
    ) {
      return {
        ...edge,
        animated
      }
    }
    return edge
  })

export const RelationshipsXYFlow = memo(function RelationshipsXYFlow() {
  const lastClickedNodeRef = useRef<XYFlowTypes.NonEmptyNode | null>(null)
  const [_scope, setScope] = useLocalStorage<'global' | 'view'>({
    key: 'likec4:scope-relationships-of',
    getInitialValueInEffect: false,
    defaultValue: 'view'
  })
  const {
    viewIncludesSubject,
    edges,
    nodes,
    subject
  } = useLayoutedRelationships(_scope)
  const scope = viewIncludesSubject ? _scope : 'global'

  const xyflow = useReactFlow<XYFlowTypes.Node, XYFlowTypes.Edge>()
  const xystore = useStoreApi()
  const overlay = useOverlayDialog()

  useEffect(() => {
    const lastClicked = lastClickedNodeRef.current
    if (lastClicked && lastClicked.data.fqn === subject.id) {
      lastClickedNodeRef.current = null
      const xynodeFrom = xyflow.getInternalNode(lastClicked.id)
      const elTo = nodes.find((n) => n.type !== 'empty' && n.id === subject.id)
      if (xynodeFrom && elTo) {
        const fromPos = xyflow.flowToScreenPosition({
            x: xynodeFrom.internals.positionAbsolute.x + xynodeFrom.width! / 2,
            y: xynodeFrom.internals.positionAbsolute.y + xynodeFrom.height! / 2
          }),
          toPos = xyflow.flowToScreenPosition({
            x: elTo.position.x + elTo.width! / 2,
            y: elTo.position.y + elTo.height! / 2
          }),
          diff = {
            x: fromPos.x - toPos.x,
            y: fromPos.y - toPos.y
          }
        xystore.getState().panBy(diff)
        xystore.getState().setNodes(nodes)
        xystore.getState().setEdges(edges)
        return
      }
    }
    xyflow.setNodes(nodes)
    xyflow.setEdges(edges)
  }, [nodes, edges])

  const zoomable = true

  useDebouncedEffect(
    () => {
      xyflow.fitView({
        padding: 0.2,
        includeHiddenNodes: true,
        maxZoom: 1,
        duration: 450
      })
    },
    [subject.id, scope],
    200
  )

  return (
    <ReactFlow
      defaultEdges={[] as XYFlowTypes.Edge[]}
      defaultNodes={[] as XYFlowTypes.Node[]}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultMarkerColor="var(--xy-edge-stroke)"
      zoomOnPinch={zoomable}
      zoomOnScroll={false}
      zoomOnDoubleClick={false}
      maxZoom={1.5}
      minZoom={0.1}
      fitView
      fitViewOptions={{
        padding: 0.2,
        maxZoom: 1,
        minZoom: 0.1,
        includeHiddenNodes: true
      }}
      preventScrolling={true}
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll
      panOnDrag
      elementsSelectable
      nodesFocusable={false}
      edgesFocusable={false}
      nodesDraggable={false}
      onNodeMouseEnter={(_, node) => {
        xyflow.setEdges(animateEdge(node, true))
      }}
      onNodeMouseLeave={(_, node) => {
        xyflow.setEdges(animateEdge(node, false))
      }}
      onEdgeMouseEnter={(_, edge) => {
        xyflow.updateEdge(edge.id, {
          zIndex: ZIndexes.max,
          animated: true
        })
      }}
      onEdgeMouseLeave={(_, edge) => {
        xyflow.updateEdge(edge.id, {
          zIndex: ZIndexes.edge,
          animated: false
        })
      }}
      onNodeClick={(e, node) => {
        if (node.type === 'empty') return
        e.stopPropagation()
        if (subject.id !== node.data.fqn) {
          lastClickedNodeRef.current = node
        }
        overlay.openOverlay({
          relationshipsOf: node.data.fqn
        })
      }}
      onDoubleClick={e => {
        e.stopPropagation()
        xyflow.fitView({
          includeHiddenNodes: true,
          maxZoom: 1,
          duration: 450
        })
      }}
    >
      <Panel position="top-center">
        <Group gap={'xs'}>
          <Box fz={'sm'} fw={'400'}>Relationships of</Box>
          <Popover position="bottom" shadow="md" withinPortal={false} closeOnClickOutside>
            <PopoverTarget>
              <Button
                size="xs"
                variant="light"
                color="gray"
                fw={'500'}
                style={{ padding: '0.25rem 0.75rem' }}
                rightSection={<IconSelector size={16} />}
              >
                {subject.title}
              </Button>
            </PopoverTarget>
            <PopoverDropdown p={'xs'}>
              <Group>
                <ThemeIcon color="orange" variant="light">
                  <IconAlertCircle size={14} />
                </ThemeIcon>
                <Text c="orange" size="sm">In progress...</Text>
              </Group>
            </PopoverDropdown>
          </Popover>

          <Space w={2} />
          <SegmentedControl
            size="xs"
            withItemsBorders={false}
            value={scope}
            onChange={setScope as any}
            data={[
              { label: 'Global', value: 'global' },
              { label: 'Current view', value: 'view', disabled: !viewIncludesSubject }
            ]}
          />
          {!viewIncludesSubject && <Text fw={500} size="xs" c="orange" component="div">View doesn't include it</Text>}
        </Group>
      </Panel>
    </ReactFlow>
  )
})
