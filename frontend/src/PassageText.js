import { defineComponent, h } from 'vue'

// Preserve literal whitespace and offsets for native Range selections and saved highlights.
export default defineComponent({
  props: { text: String, highlights: Array, selectedStart: Number },
  setup(props) {
    function tokens(part, offset) {
      const nodes = []
      let cursor = 0
      for (const match of part.matchAll(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)) {
        if (match.index > cursor) nodes.push(part.slice(cursor, match.index))
        const start = offset + match.index
        nodes.push(
          h(
            'span',
            {
              key: start,
              class: ['word-token', { 'is-selected': props.selectedStart === start }],
              'data-word': match[0],
              'data-start': start,
            },
            match[0],
          ),
        )
        cursor = match.index + match[0].length
      }
      if (cursor < part.length) nodes.push(part.slice(cursor))
      return nodes
    }
    return () => {
      const children = []
      let offset = 0
      for (const mark of [...props.highlights].sort((a, b) => a.start - b.start)) {
        if (mark.start < offset || mark.end <= mark.start || mark.end > props.text.length) continue
        children.push(...tokens(props.text.slice(offset, mark.start), offset))
        children.push(
          h(
            'mark',
            { key: mark.id, class: 'annotation annotation-' + mark.color, 'data-highlight-id': mark.id },
            tokens(props.text.slice(mark.start, mark.end), mark.start),
          ),
        )
        offset = mark.end
      }
      children.push(...tokens(props.text.slice(offset), offset))
      return h('p', { class: 'article-paragraph' }, children)
    }
  },
})
