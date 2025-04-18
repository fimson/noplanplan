import { useState } from 'react';

function Wishlist() {
  const [items, setItems] = useState([
    {
      title: "Nikko",
      votes: 0,
      link: "https://www.japan-guide.com/e/e3800.html",
      imageUrl: "https://www.2aussietravellers.com/wp-content/uploads/2018/07/Shinkyo-Bridge-in-Nikko-2.jpg",
      description: "Shrines and waterfalls",
      createdAt: new Date().toISOString()
    },
    {
      title: "Tokyo Shibuya",
      votes: 2,
      link: "https://www.japan-guide.com/e/e3007.html",
      imageUrl: "https://assets.vogue.com/photos/659db809e0e9934642099815/16:9/w_6000,h_3375,c_limit/1189690204",
      description: "Shibuya Crossing",
      createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      title: "Fushimi Inari Shrine",
      votes: 4,
      link: "https://www.japan-guide.com/e/e3915.html",
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/AB5caB8E208ojDIa3zPw4Ssp67l66OBVM2JhONi-rz8TCWhmpSqXkXW9LpV9YA360aqB5uHU760pmg3cCX5f8ObsQQ0lbmu46bNYC2QCIRX50v0RwkHf_GHEaubZYDb2xOHB-4q2-gI=s680-w680-h510",
      description: "Famous shrine with thousands of red torii gates in Kyoto",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    
    {
      title: "Kinkaku-ji (Golden Pavilion)",
      votes: 1,
      link: "https://www.japan-guide.com/e/e3908.html",
      imageUrl: "https://www.japan-guide.com/g18/3908_top.jpg",
      description: "Zen temple covered in gold leaf in Kyoto",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      title: "Kamakura Great Buddha",
      votes: 0,
      link: "https://www.japan-guide.com/e/e3100.html",
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/AB5caB-RqwP3z_g4QGGulqnKp8bAjUTSho4n6JKiy3I06fQrzJxDzaWPa86fmsCUFUiAEwGKlC0kPxkp6QjMdxZmOzHNRx3Ej2rSH7RXp4HwdvDdeibnxC5Zrb3WHg-Hx36a3527twk8qA=s680-w680-h510",
      description: "Bronze statue of Amida Buddha, one of Japan's most famous icons",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      title: "Akihabara",
      votes: 2,
      link: "https://www.japan-guide.com/e/e3003.html",
      imageUrl: "https://www.japan-guide.com/g18/740/3003_01.jpg",
      description: "Electronics district and center of otaku culture in Tokyo",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
    },
    {
      title: "Arashiyama Bamboo Grove",
      votes: 5,
      link: "https://www.japan-guide.com/e/e3912.html",
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/AB5caB_OwWta4sODptRsj2gtuC6NFdyBVyM5eOrjEfwLDXJQiMOlp66ihGFxUnwGB4FHKjrvzx4NMHLJPcBe64HWQ6zLpSVKR6XMFZLQF97PLaC_1pv0TFH2NTCpqERYNvbMWG_d46T_sQ=s680-w680-h510",
      description: "Scenic path through a dense bamboo forest in Kyoto",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
    }
  ]);
  const [newItem, setNewItem] = useState('');
  const [newItemLink, setNewItemLink] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [expandedForm, setExpandedForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMissingDetails = async (title) => {
    setIsLoading(true);
    try {
      // For development, we'll use fallback values directly
      // In production, this would call your actual API
      console.log(`Fetching details for: ${title}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock API response with relevant Japan information based on title
      let imageUrl, description, link;
      
      // Try to match some common Japanese destinations
      const lowercaseTitle = title.toLowerCase();
      
      if (lowercaseTitle.includes('tokyo')) {
        imageUrl = 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop';
        description = 'The bustling capital of Japan, known for its mix of traditional culture and cutting-edge technology.';
        link = 'https://www.japan-guide.com/e/e2164.html';
      } else if (lowercaseTitle.includes('kyoto')) {
        imageUrl = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop';
        description = 'Former imperial capital with numerous classical Buddhist temples, gardens, imperial palaces, and traditional wooden houses.';
        link = 'https://www.japan-guide.com/e/e2158.html';
      } else if (lowercaseTitle.includes('osaka')) {
        imageUrl = 'https://images.unsplash.com/photo-1590559899731-a382839e5549?q=80&w=1000&auto=format&fit=crop';
        description = 'Japan\'s kitchen and street food capital, known for its modern architecture, vibrant nightlife, and outgoing locals.';
        link = 'https://www.japan-guide.com/e/e2157.html';
      } else if (lowercaseTitle.includes('hiroshima')) {
        imageUrl = 'https://images.unsplash.com/photo-1576072085528-9a497817d3c4?q=80&w=1000&auto=format&fit=crop';
        description = 'City with a moving peace memorial park commemorating the 1945 atomic bombing, and the nearby scenic island of Miyajima.';
        link = 'https://www.japan-guide.com/e/e2160.html';
      } else if (lowercaseTitle.includes('fuji')) {
        imageUrl = 'https://images.unsplash.com/photo-1546529249-8de036dd3c9a?q=80&w=1000&auto=format&fit=crop';
        description = 'Japan\'s highest mountain at 3,776 meters, and an iconic symbol of the country with its perfectly symmetrical volcanic cone.';
        link = 'https://www.japan-guide.com/e/e2172.html';
      } else {
        // Generic Japan image for anything else
        imageUrl = 'https://source.unsplash.com/featured/?japan,' + encodeURIComponent(title);
        description = `A fascinating destination in Japan that's popular among travelers.`;
        link = `https://www.japan-guide.com/e/search_result.html?q=${encodeURIComponent(title)}`;
      }
      
      return {
        imageUrl,
        description,
        link
      };
    } catch (error) {
      console.error('Error fetching details:', error);
      
      // Fallback values
      return {
        description: `A popular destination in Japan worth visiting.`,
        link: `https://www.japan-guide.com/e/search_result.html?q=${encodeURIComponent(title)}`,
        imageUrl: `https://source.unsplash.com/featured/?japan,${encodeURIComponent(title)}`
      };
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async () => {
    if (newItem.trim() === '') return;
    
    // Start loading state
    setIsLoading(true);
    
    let itemToAdd = { 
      title: newItem, 
      votes: 0,
      link: newItemLink.trim() || null,
      imageUrl: newItemImage.trim() || null,
      description: newItemDescription.trim() || null,
      createdAt: new Date().toISOString()
    };
    
    // If some fields are missing, try to fill them with our helper
    const needsCompletion = !itemToAdd.description || !itemToAdd.link || !itemToAdd.imageUrl;
    
    if (needsCompletion && !editIndex) {
      console.log("Missing details, fetching data...");
      try {
        const completedDetails = await fetchMissingDetails(newItem);
        
        if (completedDetails) {
          console.log("Got completed details:", completedDetails);
          // Only replace fields that were empty
          if (!itemToAdd.description && completedDetails.description) {
            itemToAdd.description = completedDetails.description;
          }
          
          if (!itemToAdd.link && completedDetails.link) {
            itemToAdd.link = completedDetails.link;
          }
          
          if (!itemToAdd.imageUrl && completedDetails.imageUrl) {
            itemToAdd.imageUrl = completedDetails.imageUrl;
          }
        }
      } catch (error) {
        console.error("Error completing details:", error);
      }
    }
    
    // Now add the item (with enhanced details if available)
    if (editIndex !== null) {
      // Update existing item
      const updated = [...items];
      // Preserve the votes count when editing
      itemToAdd.votes = updated[editIndex].votes;
      updated[editIndex] = itemToAdd;
      setItems(updated);
      setEditIndex(null);
    } else {
      // Add new item at the beginning to ensure left-to-right flow
      setItems([itemToAdd, ...items]);
    }
    
    // Reset the form and loading state
    resetForm();
    setIsLoading(false);
  };

  const resetForm = () => {
    setNewItem('');
    setNewItemLink('');
    setNewItemImage('');
    setNewItemDescription('');
    setExpandedForm(false);
  };

  const upvoteItem = (index) => {
    const updated = [...items];
    updated[index].votes += 1;
    setItems(updated);
  };

  const deleteItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
    
    // If deleting the item being edited, clear the form
    if (editIndex === index) {
      resetForm();
      setEditIndex(null);
    } else if (editIndex !== null && index < editIndex) {
      // Adjust editIndex if deleting an item before it
      setEditIndex(editIndex - 1);
    }
  };

  const editItem = (index) => {
    const item = items[index];
    setNewItem(item.title);
    setNewItemLink(item.link || '');
    setNewItemImage(item.imageUrl || '');
    setNewItemDescription(item.description || '');
    setExpandedForm(true);
    setEditIndex(index);
  };

  const cancelEdit = () => {
    resetForm();
    setEditIndex(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="wishlist-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Wishlist</h2>
      </div>
      
      <div className="card bg-dark mb-4">
        <div className="card-body">
          <input
            type="text"
            className="form-control mb-3"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add a place or activity..."
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          
          {!expandedForm ? (
            <button 
              onClick={() => setExpandedForm(true)} 
              className="btn btn-secondary w-100" 
              disabled={isLoading}
            >
              More Options
            </button>
          ) : (
            <div className="expanded-form">
              <input
                type="text"
                className="form-control mb-3"
                value={newItemLink}
                onChange={(e) => setNewItemLink(e.target.value)}
                placeholder="Link (optional)"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <input
                type="text"
                className="form-control mb-3"
                value={newItemImage}
                onChange={(e) => setNewItemImage(e.target.value)}
                placeholder="Image URL (optional)"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <textarea
                className="form-control mb-3"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Description (optional)"
                rows="3"
                disabled={isLoading}
              />
              
              <div className="d-flex justify-content-end gap-2">
                {editIndex !== null && (
                  <button 
                    onClick={cancelEdit} 
                    className="btn btn-secondary" 
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={addItem} 
                  className="btn btn-primary" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Loading...
                    </>
                  ) : (
                    editIndex !== null ? 'Update' : 'Add'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="row g-4">
          {items.map((item, index) => (
            <div key={index} className="col-lg-3 col-md-6 col-12">
              <div className="card h-100">
                {item.imageUrl && (
                  <div className="card-img-top-wrapper" style={{ height: '180px', overflow: 'hidden' }}>
                    <img 
                      src={item.imageUrl} 
                      className="card-img-top"
                      alt={item.title}
                      style={{ objectFit: 'cover', height: '100%', width: '100%' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300/222/666?text=Image+Error';
                      }} 
                    />
                  </div>
                )}
                
                <div className="card-body">
                  <h5 className="card-title text-truncate">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-info">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h5>
                  
                  {item.description && (
                    <p className="card-text description-text">
                      {item.description}
                    </p>
                  )}
                </div>
                
                <div className="card-footer d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <span className="me-2">{item.votes} votes</span>
                    <button 
                      onClick={() => upvoteItem(index)} 
                      className="btn btn-sm btn-outline-primary"
                      title="Upvote"
                    >
                      👍
                    </button>
                  </div>
                  
                  <div className="btn-group">
                    <button 
                      onClick={() => editItem(index)} 
                      className="btn btn-sm btn-outline-secondary"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => deleteItem(index)} 
                      className="btn btn-sm btn-outline-danger"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center">
          Your wishlist is empty. Add some places you'd like to visit!
        </div>
      )}

      <style jsx>{`
        .description-text {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

export default Wishlist; 