import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import Modal from '../shared/Modal'
import { channelApi } from '../../api/channelApi'
import { addChannel } from '../../store/channelSlice'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CreateChannelModal({ open, onClose }: Props) {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await channelApi.create(name.toLowerCase().replace(/\s+/g, '-'), description, isPrivate)
      dispatch(addChannel(res.data))
      toast.success(`#${res.data.name} created!`)
      setName(''); setDescription(''); setIsPrivate(false)
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create channel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a channel">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel name</label>
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-transparent">
            <span className="px-3 py-3 bg-gray-50 text-gray-400 font-bold border-r border-gray-200">#</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
              placeholder="channel-name"
              required
              className="flex-1 px-3 py-3 outline-none text-sm"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Lowercase, no spaces (use hyphens)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this channel about?"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <div className="text-sm font-medium text-gray-900">Private channel</div>
            <div className="text-xs text-gray-500">Only invited people can join</div>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate(v => !v)}
            className={`w-11 h-6 rounded-full transition-colors ${isPrivate ? 'bg-brand-600' : 'bg-gray-300'}`}
          >
            <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform mx-0.5 ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!name || loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Creating...' : 'Create Channel'}
        </button>
      </form>
    </Modal>
  )
}
