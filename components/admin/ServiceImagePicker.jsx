import MediaPicker from './MediaPicker'

export default function ServiceImagePicker({ selected, onChange, maxSelect = 1 }) {
  return (
    <MediaPicker
      type="image"
      selected={selected}
      onChange={onChange}
      maxSelect={maxSelect}
    />
  )
}
