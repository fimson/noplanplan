import { useState } from 'react';

function Wishlist() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim() === '') return;
    setItems([...items, { title: newItem, votes: 0 }]);
    setNewItem('');
  };

  const upvoteItem = (index) => {
    const updated = [...items];
    updated[index].votes += 1;
    setItems(updated);
  };

  return (
    <div>
      <h2>Wishlist</h2>

      <input
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        placeholder="Add a place..."
      />
      <button onClick={addItem}>Add</button>

      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item.title} — {item.votes} votes
            <button onClick={() => upvoteItem(index)}>👍</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Wishlist; 