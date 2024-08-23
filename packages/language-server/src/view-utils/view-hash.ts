import type { ComputedView } from '@likec4/core/types'
import objectHash from 'object-hash'
import { isTruthy, map, mapToObj, pick, pipe } from 'remeda'
import type { SetOptional } from 'type-fest'

export function calcViewLayoutHash<V extends ComputedView>(view: SetOptional<V, 'hash'>): V {
  const tohash = {
    id: view.id,
    __: view.__ ?? 'element',
    autoLayout: view.autoLayout,
    nodes: pipe(
      view.nodes,
      map(pick(['id', 'title', 'description', 'technology', 'shape', 'icon', 'children'])),
      mapToObj(({ id, icon, ...node }) => [id, { ...node, icon: isTruthy(icon) ? 'Y' : 'N' }])
    ),
    edges: pipe(
      view.edges,
      map(pick(['source', 'target', 'label', 'description', 'technology', 'dir', 'head', 'tail', 'line'])),
      mapToObj(({ source, target, ...edge }) => [`${source}:${target}`, edge])
    )
  }
  view.hash = objectHash(tohash, {
    ignoreUnknown: true,
    respectType: false
  })
  return view as V
}
